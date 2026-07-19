# Memory Quiz App

Remember what you learn — spaced repetition for your own content.

## The problem

We learn constantly — from AI chats, articles, docs, courses — and forget most of it within days. That's the [forgetting curve](https://en.wikipedia.org/wiki/Forgetting_curve): without review, new knowledge decays fast. ChatGPT/Claude conversations are the worst offenders: you get a great explanation, close the tab, and a month later you're asking the same question again. Spaced-repetition apps like Anki solve retention, but they make *you* do the work of turning what you read into flashcards — which is exactly the step most people skip.

## The solution

Memory Quiz App closes that gap:

1. **Capture** — save anything you want to keep: paste an AI chat transcript, type notes, or upload a `.txt` file. Each saved item is a "conversation".
2. **Tag** — mark the conversations that matter so review effort goes where it counts.
3. **Get quizzed** — the app turns your conversations into quiz questions and re-asks them on your schedule (interval + preferred time), so knowledge is refreshed right before you'd forget it.

You don't write flashcards. You save what you learned, and the app fights the forgetting curve for you.

## Tech stack

Built with [Expo](https://expo.dev) (React Native), [expo-router](https://docs.expo.dev/router/introduction/), [NativeWind](https://www.nativewind.dev/), [Zustand](https://zustand.docs.pmnd.rs/), and [Appwrite](https://appwrite.io) as the backend (auth, database, serverless functions).

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure Appwrite. Copy `.env.example` to `.env` and fill in your project values:

   ```bash
   cp .env.example .env
   ```

   - `EXPO_PUBLIC_APPWRITE_ENDPOINT` — your Appwrite API endpoint (e.g. `https://sgp.cloud.appwrite.io/v1`)
   - `EXPO_PUBLIC_APPWRITE_PROJECT_ID` — your Appwrite project ID

   In the [Appwrite console](https://cloud.appwrite.io), register the app as platforms so requests are accepted:
   - **Android**: package name `com.mycompany.memoryquizapp`
   - **iOS**: bundle ID `com.mycompany.memoryquizapp`
   - **Web**: hostname `localhost` (for `expo start --web` development)

3. Start the app:

   ```bash
   npm start          # then press a / i / w
   npm run web        # or straight to web
   ```

## Scripts

| Script              | What it does                    |
| ------------------- | ------------------------------- |
| `npm start`         | Start the Expo dev server       |
| `npm run android`   | Start on Android                |
| `npm run ios`       | Start on iOS                    |
| `npm run web`       | Start on web                    |
| `npm run lint`      | ESLint via `expo lint`          |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |

## Project structure

```
app/
  _layout.tsx        # Root layout: session restore, splash, toast host
  index.tsx          # Redirects to /home or /login
  (auth)/            # Public routes (login, register, password reset, verification)
  (app)/             # Authenticated routes (home, quiz, edit, settings)
components/          # Shared UI components
lib/appwrite.ts      # Appwrite client singleton
services/auth.ts     # Auth API (register, login, OAuth, recovery, verification)
store/index.ts       # Zustand store (persisted: conversations + settings)
utils/validation.ts  # Shared validation patterns
```

## Auth

- Email/password registration and login (Appwrite Accounts)
- Google and GitHub OAuth (token flow via `expo-web-browser` deep links)
- Password reset and email verification via deep links (`memoryquizapp://` scheme)
- Account deactivation from Settings
- Sessions restored on app launch; route groups guard authenticated screens

## Status & roadmap

Delivered so far:

- **Phase 1 — Foundation**: real Appwrite email/password auth with session restore, route-group auth guards, local persistence (conversations + settings survive restarts), quiz flow fixes, input validation, dead code removed.
- **Phase 2 — Auth complete**: Google + GitHub OAuth (deep-link flow), password reset, email verification, account deactivation, safe user-facing error messages.

Pending:

- **Phase 3 — Real quizzes**: sync conversations to Appwrite Databases (per-user permissions); generate questions from conversation content (server-side LLM function + on-device fill-in-the-blank fallback); per-conversation quiz history; SM-2 spaced-repetition scheduling; local notifications honoring the interval/time settings.
- **Phase 4 — Admin portal & analytics**: privacy-safe event tracking (names + timestamps, never content); web `/admin` dashboard gated by an Appwrite "admins" team — active users, retention, quiz accuracy, per-user activity.
- **Phase 5 — Gamification & design system**: memory strength meter per conversation (decays over time, restored by correct answers), daily streaks, review heatmap, XP/levels, achievements, daily goal ring; shared component library, working dark mode, micro-interactions, onboarding.
- **Phase 6 — Production hardening**: unit + e2e tests, CI, crash reporting, EAS build profiles, privacy policy, security review.
