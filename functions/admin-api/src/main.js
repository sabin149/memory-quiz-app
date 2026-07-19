/**
 * Appwrite Function: privileged admin operations for the in-app admin portal.
 *
 * The server API key lives only in this function's env (API_KEY). Every call
 * verifies that the CALLER is a confirmed member of the "admins" team before
 * doing anything — execute access being "users" only stops guests.
 *
 * Request body (JSON): { "action": string, ...params }
 *   listUsers   { search?, cursor?, limit? }
 *   blockUser   { userId }   unblockUser { userId }
 *   verifyUser  { userId }
 *   deleteUser  { userId }
 */
import { Client, Query, Users } from 'node-appwrite';

function safeUser(u) {
  return {
    id: u.$id,
    name: u.name,
    email: u.email,
    status: u.status,
    emailVerification: u.emailVerification,
    registration: u.registration,
    lastActivity: u.accessedAt,
  };
}

export default async ({ req, res, error }) => {
  if (!process.env.API_KEY) {
    error('API_KEY is not configured on this function.');
    return res.json({ error: 'not_configured' }, 500);
  }

  const callerId = req.headers['x-appwrite-user-id'];
  if (!callerId) return res.json({ error: 'unauthorized' }, 401);

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.API_KEY);
  const users = new Users(client);

  // The team gate: only confirmed "admins" members may proceed.
  const memberships = await users.listMemberships(callerId);
  const isAdmin = memberships.memberships.some((m) => m.teamId === 'admins' && m.confirm);
  if (!isAdmin) return res.json({ error: 'forbidden' }, 403);

  let payload;
  try {
    payload = JSON.parse(req.body || '{}');
  } catch {
    return res.json({ error: 'bad_request' }, 400);
  }
  const { action, userId } = payload;

  try {
    if (action === 'listUsers') {
      const limit = Math.min(100, Math.max(1, Number(payload.limit) || 25));
      const queries = [Query.limit(limit), Query.orderDesc('$createdAt')];
      if (typeof payload.cursor === 'string' && payload.cursor) {
        queries.push(Query.cursorAfter(payload.cursor));
      }
      const result = await users.list(
        queries,
        typeof payload.search === 'string' && payload.search ? payload.search : undefined
      );
      return res.json({ total: result.total, users: result.users.map(safeUser) });
    }

    if (!userId || typeof userId !== 'string') return res.json({ error: 'bad_request' }, 400);
    if (userId === callerId) return res.json({ error: 'cannot_act_on_self' }, 400);

    switch (action) {
      case 'blockUser':
        return res.json({ user: safeUser(await users.updateStatus(userId, false)) });
      case 'unblockUser':
        return res.json({ user: safeUser(await users.updateStatus(userId, true)) });
      case 'verifyUser':
        return res.json({ user: safeUser(await users.updateEmailVerification(userId, true)) });
      case 'deleteUser':
        await users.delete(userId);
        return res.json({ deleted: userId });
      default:
        return res.json({ error: 'unknown_action' }, 400);
    }
  } catch (e) {
    error(`admin-api ${action} failed: ${e.message}`);
    return res.json({ error: 'server_error', message: e.message?.slice(0, 200) }, 500);
  }
};
