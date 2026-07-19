/**
 * Appwrite Function: generates comprehension-focused quiz questions from
 * saved content, a free-form topic, or a public URL, using an
 * OpenAI-compatible chat completions API. The API key stays in the
 * function's environment (OPENAI_API_KEY) and never reaches the app bundle.
 *
 * Request body (JSON):
 *   { "content"?: string, "topic"?: string, "url"?: string,
 *     "difficulty"?: "easy"|"medium"|"hard", "count"?: number }
 * Response body (JSON): { "questions": [{ "question", "options", "correct" }] }
 */
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const API_URL = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
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
  if (!process.env.OPENAI_API_KEY) {
    error('OPENAI_API_KEY is not configured on this function.');
    return res.json({ questions: [] }, 500);
  }

  let payload;
  try {
    payload = JSON.parse(req.body || '{}');
  } catch {
    return res.json({ questions: [] }, 400);
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
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      error(`LLM API returned ${response.status}`);
      return res.json({ questions: [] }, 502);
    }

    const completion = await response.json();
    const parsed = JSON.parse(completion.choices?.[0]?.message?.content ?? '{}');
    const questions = Array.isArray(parsed.questions)
      ? parsed.questions.filter(isValidQuestion).slice(0, count)
      : [];
    return res.json({ questions });
  } catch (e) {
    error(`Quiz generation failed: ${e.message}`);
    return res.json({ questions: [] }, 500);
  }
};
