# generate-quiz (Appwrite Function)

Turns a conversation's content into multiple-choice quiz questions using an
OpenAI-compatible API. Deploying it is optional — without it the app falls
back to on-device fill-in-the-blank generation.

## Deploy

1. Appwrite console → Functions → Create function → Node 18+ runtime, entrypoint `src/main.js`, upload this folder (or connect the repo and set root to `functions/generate-quiz`).
2. Settings → Environment variables:
   - `OPENAI_API_KEY` (required)
   - `OPENAI_MODEL` (optional, default `gpt-4o-mini`)
   - `OPENAI_API_URL` (optional, for non-OpenAI providers)
3. Settings → Execute access: role `users` (any logged-in user).
4. Put the function id into the app's `.env`: `EXPO_PUBLIC_APPWRITE_QUIZ_FUNCTION_ID=<id>`.

The API key lives only in the function's environment — it is never shipped in
the app bundle.
