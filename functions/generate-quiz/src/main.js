/**
 * Appwrite Function: generates quiz questions from conversation content using
 * an OpenAI-compatible chat completions API. The API key stays in the
 * function's environment (OPENAI_API_KEY) and never reaches the app bundle.
 *
 * Request body (JSON):  { "title": string, "content": string }
 * Response body (JSON): { "questions": [{ "question", "options", "correct" }] }
 */
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const API_URL = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
const MAX_CONTENT_CHARS = 12000;

const SYSTEM_PROMPT = `You create quiz questions that test whether someone remembers a text they saved.
Return ONLY valid JSON of the shape {"questions":[{"question":string,"options":[string,string,string,string],"correct":number}]}.
Rules: 3 to 5 questions; each has exactly 4 options; "correct" is the 0-based index of the right option;
questions must be answerable from the text alone; never reveal the answer inside the question.`;

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
  const { title, content } = payload;
  if (typeof content !== 'string' || content.trim().length < 40) {
    return res.json({ questions: [] }, 400);
  }

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
          {
            role: 'user',
            content: `Title: ${typeof title === 'string' ? title : ''}\n\nText:\n${content.slice(0, MAX_CONTENT_CHARS)}`,
          },
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
      ? parsed.questions.filter(isValidQuestion).slice(0, 5)
      : [];
    return res.json({ questions });
  } catch (e) {
    error(`Quiz generation failed: ${e.message}`);
    return res.json({ questions: [] }, 500);
  }
};
