# generate-quiz (Appwrite Function)

Generates comprehension-focused multiple-choice questions using an
OpenAI-compatible API, from any of three sources:

- `content` — a saved conversation's text
- `topic` — a free-form topic string (Practice tab)
- `url` — a public web page, fetched and cleaned server-side (Practice tab)

Supports `difficulty` (easy/medium/hard) and `count` (1-15). Deploying it is
optional — without it, saved-content quizzes fall back to on-device
fill-in-the-blank generation, and topic/URL generation is disabled.

## Deploy

1. Appwrite console → Functions → Create function → Node 18+ runtime, entrypoint `src/main.js`, upload this folder (or connect the repo and set root to `functions/generate-quiz`).
2. Settings → Environment variables:
   - `AI_PROVIDER` — `gemini` | `openai` | `groq` | `together` | `openrouter` (default `openai`)
   - `AI_API_KEY` — the key for that provider (required)
   - `AI_MODEL` / `AI_API_URL` — optional overrides of the provider preset
   - (legacy `OPENAI_API_KEY`/`OPENAI_MODEL`/`OPENAI_API_URL` still work)

   Example for Google Gemini's free tier:

   ```text
   AI_PROVIDER=gemini
   AI_API_KEY=<your Gemini key from aistudio.google.com>
   ```

3. Settings → Execute access: role `users` (any logged-in user).
4. Put the function id into the app's `.env` (and the Appwrite Sites env for the web build): `EXPO_PUBLIC_APPWRITE_QUIZ_FUNCTION_ID=<id>`.

The API key lives only in the function's environment — never in the app's
`.env`, never in the Sites env, never in the bundle. Switching providers is
just changing `AI_PROVIDER` + `AI_API_KEY` on the function and redeploying.
