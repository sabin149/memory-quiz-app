# Memory Quiz App

Remember what you learn. Save conversations — notes, AI chat transcripts, pasted text, or uploaded `.txt` files — tag the important ones, and get quizzed on them at your own interval (spaced repetition for your own content).

Built with [Expo](https://expo.dev) (React Native), [expo-router](https://docs.expo.dev/router/introduction/), [NativeWind](https://www.nativewind.dev/), [Zustand](https://zustand.docs.pmnd.rs/), and [Appwrite](https://appwrite.io) as the backend.

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

## Roadmap

- Conversation sync to Appwrite Databases
- Real quiz generation from conversation content (LLM function + local fallback)
- Spaced-repetition scheduling + local notifications
- Admin analytics portal
- Gamification (memory strength, streaks, XP)
