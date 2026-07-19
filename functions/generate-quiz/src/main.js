/**
 * Appwrite Function: generates comprehension-focused quiz questions from
 * saved content, a free-form topic, or a public URL, using an
 * OpenAI-compatible chat completions API. The API key stays in the
 * function's environment (AI_API_KEY) and never reaches the app bundle.
 *
 * Request body (JSON):
 *   { "content"?: string, "topic"?: string, "url"?: string,
 *     "difficulty"?: "easy"|"medium"|"hard", "count"?: number }
 * Response body (JSON): { "questions": [{ "question", "options", "correct" }] }
 */
/**
 * Provider selection: set AI_PROVIDER to a preset and AI_API_KEY to its key.
 * AI_MODEL / AI_API_URL override the preset when needed. The legacy
 * OPENAI_API_KEY / OPENAI_MODEL / OPENAI_API_URL variables still work.
 * All providers here speak the OpenAI chat-completions protocol.
 */
const PROVIDERS = {
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
  },
  gemini: {
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: 'gemini-2.0-flash',
  },
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
  },
  together: {
    url: 'https://api.together.xyz/v1/chat/completions',
    model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
  },
  openrouter: {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'google/gemini-2.0-flash-001',
  },
};

const preset = PROVIDERS[(process.env.AI_PROVIDER || 'openai').toLowerCase()] ?? PROVIDERS.openai;
const API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
const MODEL = process.env.AI_MODEL || process.env.OPENAI_MODEL || preset.model;
const API_URL = process.env.AI_API_URL || process.env.OPENAI_API_URL || preset.url;
const MAX_CONTENT_CHARS = 12000;
const MAX_COUNT = 15;

const SYSTEM_PROMPT = `You write quiz questions that test UNDERSTANDING, not rote recall.
Return ONLY valid JSON: {"questions":[{"question":string,"options":[string,string,string,string],"correct":number}]}.
Rules:
- Each question has exactly 4 options; "correct" is the 0-based index of the right one.
- Test comprehension: ask about implications, causes, comparisons, applications, and "why" — never fill-in-the-blank or verbatim recall of a sentence.
- Wrong options must be plausible to someone who skimmed the material.
- Questions must be answerable from the provided material (or well-established knowledge for topic mode).
- Never reveal the answer inside the question.`;

async function chatCompletion(systemPrompt, userPrompt, jsonMode = true) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  if (!response.ok) throw new Error(`LLM API returned ${response.status}`);
  const completion = await response.json();
  return completion.choices?.[0]?.message?.content ?? '';
}

function isValidQuestion(q) {
  return (
    q &&
    typeof q.question === 'string' &&
    Array.isArray(q.options) &&
    q.options.length === 4 &&
    q.options.every((o) => typeof o === 'string') &&
    Number.isInteger(q.correct) &&
    q.correct >= 0 &&
    q.correct < 4
  );
}

/** Fetches a public page server-side and reduces it to readable text. */
async function fetchUrlText(url, error) {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    const response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'MemoryQuizBot/1.0 (+quiz generation)' },
    });
    if (!response.ok) return null;
    const html = await response.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#\d+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  } catch (e) {
    error(`URL fetch failed: ${e.message}`);
    return null;
  }
}

export default async ({ req, res, error }) => {
  if (!API_KEY) {
    error('AI_API_KEY is not configured on this function.');
    return res.json({ questions: [] }, 500);
  }

  let payload;
  try {
    payload = JSON.parse(req.body || '{}');
  } catch {
    return res.json({ questions: [] }, 400);
  }

  // Explain mode: why was the picked answer wrong (learning reinforcement)?
  if (payload.explain && typeof payload.explain === 'object') {
    const { question, options, correct, selected, context } = payload.explain;
    if (
      typeof question !== 'string' ||
      !Array.isArray(options) ||
      !Number.isInteger(correct) ||
      !Number.isInteger(selected)
    ) {
      return res.json({ explanation: null }, 400);
    }
    try {
      const explanation = await chatCompletion(
        'You are a concise tutor. In at most 2 sentences, explain why the correct answer is right and, if relevant, why the chosen answer is a common mix-up. No preamble, no repetition of the question.',
        `Question: ${question}\nOptions: ${options.join(' | ')}\nCorrect answer: ${options[correct]}\nLearner chose: ${options[selected]}` +
          (typeof context === 'string' && context
            ? `\n\nSource material:\n${context.slice(0, 4000)}`
            : ''),
        false
      );
      return res.json({ explanation: explanation.trim().slice(0, 600) });
    } catch (e) {
      error(`Explanation failed: ${e.message}`);
      return res.json({ explanation: null }, 502);
    }
  }

  const { content, topic, url } = payload;
  const difficulty = ['easy', 'medium', 'hard'].includes(payload.difficulty)
    ? payload.difficulty
    : 'medium';
  const count = Math.min(MAX_COUNT, Math.max(1, Number(payload.count) || 5));

  let material = null;
  let mode = null;
  if (typeof content === 'string' && content.trim().length >= 40) {
    material = content;
    mode = 'the following saved notes';
  } else if (typeof url === 'string' && url.trim()) {
    material = await fetchUrlText(url.trim(), error);
    if (!material || material.length < 200) return res.json({ questions: [] }, 422);
    mode = 'the following web page content';
  } else if (typeof topic === 'string' && topic.trim().length >= 3) {
    material = null;
    mode = `the topic "${topic.trim()}"`;
  } else {
    return res.json({ questions: [] }, 400);
  }

  const userPrompt =
    `Create exactly ${count} ${difficulty}-difficulty comprehension questions about ${mode}.` +
    (material ? `\n\nMaterial:\n${material.slice(0, MAX_CONTENT_CHARS)}` : '');

  try {
    const raw = await chatCompletion(SYSTEM_PROMPT, userPrompt);
    const parsed = JSON.parse(raw || '{}');
    const questions = Array.isArray(parsed.questions)
      ? parsed.questions.filter(isValidQuestion).slice(0, count)
      : [];
    // For URL quizzes, return the fetched text so the app can offer to save
    // it to the library (spaced repetition needs the content).
    const sourceText =
      typeof url === 'string' && url.trim() && material ? material.slice(0, 8000) : undefined;
    return res.json(sourceText ? { questions, sourceText } : { questions });
  } catch (e) {
    error(`Quiz generation failed: ${e.message}`);
    return res.json({ questions: [] }, 500);
  }
};
