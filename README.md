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

## Features, screen by screen

### Onboarding (`/onboarding`)
- Three-slide first-run introduction (the forgetting curve → capture → scheduled quizzes) with icons, slide indicators, and skip
- Shown once; a persisted flag skips it on later launches

### Login (`/login`)
- Email/password login with zod field validation and inline errors
- Password show/hide toggle
- Server errors mapped to the offending field (e.g. wrong credentials under the password input)
- Google and GitHub OAuth buttons (deep-link token flow)
- Links to registration and password reset

### Register (`/register`)
- First name, last name, phone with country-code picker (25 countries), email, password + confirm — all zod-validated inline
- Duplicate-email (409) shown directly under the email field
- Sends a verification email automatically and routes to the verification gate
- OAuth sign-up buttons and a privacy-policy link

### Verify email gate (`/verify-pending`, `/verify-email`)
- Unverified accounts cannot enter the app: gate screen with resend, "I've verified — continue" re-check, and logout
- `/verify-email` handles the emailed link (deep link on native, site URL on web) and confirms the address

### Forgot / reset password (`/forgot-password`, `/reset-password`)
- Enumeration-safe request flow (never reveals whether an email exists)
- Emailed link opens the in-app reset screen (validated new password + confirm)

### Library (home tab)
- Compact stats strip: streak, level, XP, and due-count badge → taps through to Progress
- Full-text search across titles and content
- Add (`+`) and upload-`.txt` actions
- Conversation cards: title, saved date, word count, tagged marker, due badge, and an animated **memory-strength bar** (decays over time, refills when you quiz)
- Offline banner when the backend is unreachable; local changes sync on next launch

### Add conversation (`/edit`)
- Blank note/paste form, or pre-filled from an uploaded text file (title derived from filename)
- Validated title + content; saves locally first, then syncs to Appwrite

### Conversation detail (`/conversation/[id]`)
- Full content, saved date, word count, sync status
- Memory strength with last-quiz score and next-review date; due badge
- Tag/untag and delete (with confirmation)
- Quiz setup: difficulty (easy/medium/hard) and question count (5/10/15) → start

### Quiz (`/quiz`)
- Questions generated from the source content (AI function when configured, on-device generator as fallback)
- One question at a time with slide-in transitions; answered options lock; correct answer highlighted green, wrong pick red, with check/cross icons and haptic feedback on phones
- Results screen: score, XP earned (+perfect bonus), next scheduled review date, retry
- Completing a quiz updates the SM-2 schedule, records the attempt, XP, streak, and reschedules the reminder notification

### Practice tab
- Ad-hoc AI quizzes without saving anything: enter a **topic** or a **public URL** (fetched and cleaned server-side), pick difficulty and question count, generate
- Earns XP and streak but creates no review schedule (explained in-app)
- Shows a setup notice when the AI function isn't configured

### Progress tab (`/stats`)
- Streak / level / total XP cards with icons
- Animated level progress bar (quadratic XP curve)
- GitHub-style 16-week review heatmap
- Quiz totals (completed, perfect, mastered conversations)
- 8 achievements with locked/unlocked states

### Profile tab
- Avatar initial, name, email, verification status (with resend link)
- Streak / level / saved-count summary
- Links: reminder & appearance preferences, progress, privacy policy, admin portal (admins only)
- Log out and delete account (deactivation with destructive confirmation)

### Preferences (`/settings`)
- Appearance: System / Light / Dark (persisted; dark mode fully functional)
- Quiz reminders: interval in days (1–365) and preferred time (24h HH:MM), validated; saving reschedules the local notification

### Privacy policy (`/privacy`)
- What's stored, privacy-safe analytics, AI generation, crash reporting, and user controls

### Admin portal (`/admin` — visible only to the Appwrite `admins` team, server-verified)
- **Dashboard**: DAU/WAU, signups, quizzes, average accuracy, content volume (7d KPI cards with icons); 14-day events-vs-quizzes line chart; per-day accuracy bar chart; event-type breakdown
- **Users**: per-user activity summaries (last active, events, quizzes, average score) with id filter and pagination
- **User drill-down**: event timeline (names + timestamps only)
- Privacy-safe by design: analytics store event name + user id + timestamp — never content or emails

### Cross-cutting
- Appwrite backend: per-user document permissions (nobody can read another user's content, admins included)
- Offline-first local cache with background sync and pending-delete retry
- Cross-device progress sync via account prefs (replay-safe merge)
- Local notification reminders honoring interval/time preferences
- Native-styled toasts, vector icons everywhere, entrance/transition animations
- Accessibility: roles, labels, and selected-states on interactive controls
- Opt-in Sentry crash reporting with PII stripped

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

3. Provision the database (once per project). Create an API key in the Appwrite console (scope: `databases.write`) and run:

   ```bash
   APPWRITE_API_KEY=<server-key> node scripts/setup-appwrite.mjs
   ```

   This creates the `memoryquiz` database with `conversations` and `quiz_attempts` collections (document-level permissions — users can only ever read their own data). Until it runs, the app still works fully offline from the local cache.

4. Start the app:

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
| `npm test`          | Jest unit + component tests     |

## Project structure

```
app/
  _layout.tsx              # Root layout: session restore, splash, toast host
  index.tsx                # Redirects to /home or /login
  (auth)/                  # Public routes (login, register, password reset)
  (app)/                   # Authenticated routes (home, quiz, edit, settings)
  admin/                   # Admin portal (requires "admins" team membership)
components/                # Shared UI components
functions/generate-quiz/   # Optional Appwrite Function for LLM quiz generation
lib/appwrite.ts            # Appwrite client + database/collection ids
scripts/setup-appwrite.mjs # One-time database provisioning (needs API key)
services/
  auth.ts                  # Register, login, OAuth, recovery, verification
  conversations.ts         # Conversation + quiz-attempt CRUD (Appwrite Databases)
  quiz.ts                  # Quiz generation (LLM function -> local fallback)
  notifications.ts         # Local quiz reminder scheduling
store/index.ts             # Zustand store (persisted cache; Appwrite is source of truth)
utils/
  quizGenerator.ts         # On-device cloze question generation
  sm2.ts                   # SM-2 spaced-repetition algorithm
  validation.ts            # Shared validation patterns
```

## Docker

No local Node setup needed — three services in `docker-compose.yml`:

```bash
docker compose up expo-tunnel   # dev server; QR works from any network (recommended)
docker compose up expo-dev      # dev server, LAN mode (set HOST_LAN_IP=<your ip>)
docker compose up web           # production web build on http://localhost:8080
```

Expo Go + Docker: use `expo-tunnel`. LAN mode requires the phone to reach this
machine directly, which corporate networks often block; the tunnel only makes
outbound connections, so its QR code is scannable from anywhere. The `web`
service serves plain HTTP for local testing only — in production, deploy the
export behind a TLS-terminating platform (e.g. Appwrite Sites).

## Testing & CI

- `npm test` runs 42 Jest tests (SM-2 scheduling, quiz generation, gamification, admin aggregations, validation, UI components) with the `jest-expo` preset.
- `.gitlab-ci.yml` runs lint, typecheck, and tests (with coverage and JUnit reports) on every merge request and branch push.
- Crash reporting: set `EXPO_PUBLIC_SENTRY_DSN` to enable Sentry; events are scrubbed of PII before sending. Leave unset to disable entirely.
- Builds: `eas.json` defines `development`, `preview`, and `production` profiles for EAS Build.

## Auth

- Email/password registration and login (Appwrite Accounts)
- Google and GitHub OAuth (token flow via `expo-web-browser` deep links)
- Password reset and email verification via deep links (`memoryquizapp://` scheme)
- Account deactivation from Settings
- Sessions restored on app launch; route groups guard authenticated screens

## Quizzes & spaced repetition

- Questions are generated from the conversation's own content:
  - **Default**: on-device cloze deletion (fill-in-the-blank multiple choice) — free, offline
  - **Optional**: LLM generation via the `functions/generate-quiz` Appwrite Function (see its README); the app falls back to on-device generation automatically
- Each quiz result feeds an SM-2 spaced-repetition schedule per conversation; the home screen shows what's due for review
- Conversations sync to Appwrite Databases with per-user document permissions; offline changes are cached locally and pushed on the next launch
- A local notification reminds you to review, honoring the interval (days) and time set in Settings

## Progress & gamification

- **Memory strength meter** on every conversation: decays exponentially since your last review (the SM-2 interval is the half-life) and is restored by quizzing
- **Daily streak** (survives until a full day is missed), **XP** (+10 per correct answer, +20 perfect bonus) and a quadratic **level curve**
- **Stats screen**: GitHub-style review heatmap (16 weeks), level progress, achievements
- Progress syncs across devices via Appwrite account preferences

## Admin portal

Members of the Appwrite `admins` team see an **Admin portal** entry on the home screen (best experienced on web via `npm run web`):

- Dashboard: DAU/WAU, signups, quizzes taken, average accuracy, content volume, 7-day activity chart
- Per-user activity list and per-user event timeline drill-down

Analytics are privacy-safe by design: the `events` collection stores only an event name, user id, and timestamp — user content is never collected, and only the `admins` team can read events and quiz scores. To make yourself an admin, run the provisioning script with your registered email:

```bash
APPWRITE_API_KEY=<server-key> ADMIN_EMAIL=you@example.com node scripts/setup-appwrite.mjs
```

## Status & roadmap

Delivered so far:

- **Phase 1 — Foundation**: real Appwrite email/password auth with session restore, route-group auth guards, local persistence (conversations + settings survive restarts), quiz flow fixes, input validation, dead code removed.
- **Phase 2 — Auth complete**: Google + GitHub OAuth (deep-link flow), password reset, email verification, account deactivation, safe user-facing error messages.
- **Phase 3 — Real quizzes**: conversations synced to Appwrite Databases (per-user permissions); questions generated from conversation content (on-device cloze + optional LLM function); quiz attempts recorded; SM-2 spaced-repetition scheduling with due badges; local notifications honoring the interval/time settings.
- **Phase 4 — Admin portal & analytics**: privacy-safe event tracking (names + timestamps, never content); `/admin` dashboard gated by the Appwrite "admins" team — DAU/WAU, signups, quiz accuracy, activity chart, per-user drill-down.
- **Phase 5 — Gamification & design system**: memory strength meter per conversation (decays over time, restored by quizzes), daily streaks, XP/levels with progress, achievements, GitHub-style review heatmap, stats screen, cross-device progress sync via account prefs; shared UI kit (Button/Card/EmptyState), working dark mode with a system/light/dark setting, haptic feedback on answers.

- **Phase 6 — Production hardening**: Jest + React Native Testing Library test suite (42 tests), GitLab CI (lint/typecheck/test with coverage + JUnit reports), opt-in Sentry crash reporting (PII stripped), EAS build profiles, privacy policy screen, first-run onboarding, bundle security scan (no server keys shipped).

Later ideas: Maestro e2e flows, weekly leaderboard, challenge mode, shareable memory reports, ChatGPT/Claude share-link import, folders/topics, web clipper.
