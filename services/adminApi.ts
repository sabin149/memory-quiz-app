import { ExecutionMethod } from 'react-native-appwrite';
import { functions } from '@/lib/appwrite';

const ADMIN_FUNCTION_ID = process.env.EXPO_PUBLIC_APPWRITE_ADMIN_FUNCTION_ID ?? null;

/** True when the privileged admin function is configured for this build. */
export function adminApiAvailable(): boolean {
  return ADMIN_FUNCTION_ID !== null;
}

export interface AccountRecord {
  id: string;
  name: string;
  email: string;
  /** false = blocked. */
  status: boolean;
  emailVerification: boolean;
  registration: string;
  lastActivity: string;
}

async function call<T>(payload: object): Promise<T> {
  if (!ADMIN_FUNCTION_ID) throw new Error('Admin function is not configured.');
  const execution = await functions.createExecution(
    ADMIN_FUNCTION_ID,
    JSON.stringify(payload),
    false,
    undefined,
    ExecutionMethod.POST
  );
  if (execution.status !== 'completed') {
    throw new Error('Admin function execution failed. Check its Executions tab.');
  }
  const parsed = JSON.parse(execution.responseBody);
  if (execution.responseStatusCode >= 400) {
    throw new Error(parsed?.error ?? 'Admin request rejected.');
  }
  return parsed as T;
}

export function listAccounts(params: { search?: string; cursor?: string; limit?: number }) {
  return call<{ total: number; users: AccountRecord[] }>({ action: 'listUsers', ...params });
}

export function setAccountBlocked(userId: string, blocked: boolean) {
  return call<{ user: AccountRecord }>({ action: blocked ? 'blockUser' : 'unblockUser', userId });
}

export function verifyAccount(userId: string) {
  return call<{ user: AccountRecord }>({ action: 'verifyUser', userId });
}

export function deleteAccount(userId: string) {
  return call<{ deleted: string }>({ action: 'deleteUser', userId });
}
