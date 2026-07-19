# admin-api (Appwrite Function)

Privileged user-management operations for the in-app admin portal: list all
accounts (with search), block/unblock, force-verify email, delete.

Security model:
- The server API key lives ONLY in this function's env (`API_KEY`).
- Execute access is role `users`, but every request re-verifies that the
  caller is a confirmed member of the `admins` team before acting.
- Acting on your own account is rejected (prevents self-lockout).

## Deploy

1. Create the function (Node runtime, entrypoint `src/main.js`, build `npm install`), upload this folder.
2. Env var: `API_KEY` — an Appwrite API key with scopes `users.read`, `users.write`, `teams.read`. Prefer a dedicated key.
3. Execute access: role `users`.
4. App config: `EXPO_PUBLIC_APPWRITE_ADMIN_FUNCTION_ID=<function id>` in `.env` / site env.
