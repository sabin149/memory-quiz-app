import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { AppwriteException, ID, Models, OAuthProvider } from 'react-native-appwrite';
import { account, appwriteCallbackScheme } from '@/lib/appwrite';

export type User = Models.User<Models.Preferences>;

export type OAuthProviderKey = 'google' | 'github';

const OAUTH_PROVIDERS: Record<OAuthProviderKey, OAuthProvider> = {
  google: OAuthProvider.Google,
  github: OAuthProvider.Github,
};

/**
 * Maps Appwrite error codes to messages safe and useful to show users.
 * Never surfaces raw server payloads in the UI.
 */
export function toAuthErrorMessage(error: unknown): string {
  if (error instanceof AppwriteException) {
    switch (error.type) {
      case 'user_invalid_credentials':
        return 'Incorrect email or password.';
      case 'user_not_found':
        return 'No account found with this email.';
      case 'user_already_exists':
      case 'user_email_already_exists':
        return 'An account with this email already exists.';
      case 'user_password_mismatch':
        return 'Passwords do not match.';
      case 'user_password_recently_used':
        return 'Please choose a password you have not used before.';
      case 'general_rate_limit_exceeded':
        return 'Too many attempts. Please wait a moment and try again.';
      case 'user_blocked':
        return 'This account has been disabled.';
      case 'user_invalid_token':
        return 'This link has expired or was already used. Request a new one.';
      case 'user_oauth2_provider_error':
      case 'user_oauth2_unauthorized':
        return 'Sign-in with the provider failed. Please try again.';
      case 'user_session_not_found':
        return 'Your session has expired. Please log in again.';
      default:
        if (error.code === 429) return 'Too many attempts. Please wait a moment and try again.';
        if (error.code === 400) return 'Invalid input. Check the form and try again.';
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

/**
 * OAuth2 token flow: opens the provider's consent page in the system browser,
 * then exchanges the userId/secret from the deep-link redirect for a session.
 * Returns null when the user cancels the browser flow.
 */
export async function loginWithOAuth(provider: OAuthProviderKey): Promise<User | null> {
  const redirect = `${appwriteCallbackScheme}://oauth`;
  const authUrl = account.createOAuth2Token(OAUTH_PROVIDERS[provider], redirect, redirect);
  if (!authUrl) {
    throw new AppwriteException('Failed to build the OAuth URL.');
  }

  const result = await WebBrowser.openAuthSessionAsync(authUrl.toString(), redirect);
  if (result.type !== 'success' || !result.url) {
    return null; // user dismissed the browser
  }

  const { queryParams } = Linking.parse(result.url);
  const userId = typeof queryParams?.userId === 'string' ? queryParams.userId : null;
  const secret = typeof queryParams?.secret === 'string' ? queryParams.secret : null;
  if (!userId || !secret) {
    throw new AppwriteException('OAuth redirect did not include credentials.');
  }

  return completeOAuthLogin(userId, secret);
}

/** Exchanges the userId/secret from an OAuth redirect for a session. */
export async function completeOAuthLogin(userId: string, secret: string): Promise<User> {
  await account.createSession(userId, secret);
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

/**
 * Persists gamification progress in Appwrite account prefs so XP/streaks
 * follow the user across devices. Fire-and-forget.
 */
export function saveGamificationPrefs(gamification: object): void {
  account.updatePrefs({ gamification }).catch(() => {});
}

/** Emails a password-reset link that deep-links back into the app. */
export async function requestPasswordReset(email: string): Promise<void> {
  await account.createRecovery(email, `${appwriteCallbackScheme}://reset-password`);
}

/** Completes a reset started from the emailed link. */
export async function completePasswordReset(
  userId: string,
  secret: string,
  newPassword: string
): Promise<void> {
  await account.updateRecovery(userId, secret, newPassword);
}

/** Emails a verification link to the logged-in user's address. */
export async function sendVerificationEmail(): Promise<void> {
  await account.createVerification(`${appwriteCallbackScheme}://verify-email`);
}

/** Confirms the address using the userId/secret from the emailed link. */
export async function confirmVerification(userId: string, secret: string): Promise<void> {
  await account.updateVerification(userId, secret);
}

/**
 * Blocks the account and ends the session. Client SDKs cannot hard-delete a
 * user; permanent deletion will move to a server-side function in a later
 * phase. A blocked account can no longer log in.
 */
export async function deactivateAccount(): Promise<void> {
  await account.updateStatus();
  try {
    await account.deleteSession('current');
  } catch {
    // Blocking the account can already invalidate the session; nothing to do.
  }
}
