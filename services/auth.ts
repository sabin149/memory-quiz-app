import { AppwriteException, ID, Models } from 'react-native-appwrite';
import { account } from '@/lib/appwrite';

export type User = Models.User<Models.Preferences>;

/**
 * Maps Appwrite error codes to messages safe and useful to show users.
 * Never surfaces raw server payloads in the UI.
 */
export function toAuthErrorMessage(error: unknown): string {
  if (error instanceof AppwriteException) {
    switch (error.type) {
      case 'user_invalid_credentials':
        return 'Incorrect email or password.';
      case 'user_already_exists':
      case 'user_email_already_exists':
        return 'An account with this email already exists.';
      case 'user_password_mismatch':
        return 'Passwords do not match.';
      case 'general_rate_limit_exceeded':
        return 'Too many attempts. Please wait a moment and try again.';
      case 'user_blocked':
        return 'This account has been blocked.';
      default:
        if (error.code === 400) return 'Invalid email or password format.';
        return 'Something went wrong. Please try again.';
    }
  }
  return 'Network error. Check your connection and try again.';
}

export async function register(name: string, email: string, password: string): Promise<User> {
  await account.create(ID.unique(), email, password, name);
  return login(email, password);
}

export async function login(email: string, password: string): Promise<User> {
  await account.createEmailPasswordSession(email, password);
  return account.get();
}

export async function logout(): Promise<void> {
  await account.deleteSession('current');
}

/** Returns the current user if a valid session exists, otherwise null. */
export async function getCurrentUser(): Promise<User | null> {
  try {
    return await account.get();
  } catch {
    return null;
  }
}
