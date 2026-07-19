import { Account, Client, Databases, Functions } from 'react-native-appwrite';

const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;

if (!endpoint || !projectId) {
  throw new Error(
    'Missing Appwrite configuration. Copy .env.example to .env and set EXPO_PUBLIC_APPWRITE_ENDPOINT and EXPO_PUBLIC_APPWRITE_PROJECT_ID.'
  );
}

export const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setPlatform('com.mycompany.memoryquizapp');

export const account = new Account(client);
export const databases = new Databases(client);
export const functions = new Functions(client);

/**
 * Scheme Appwrite trusts out of the box for OAuth/recovery/verification
 * redirects, without requiring platform registration in the console.
 * Also registered as an app scheme in app.json.
 */
export const appwriteCallbackScheme = `appwrite-callback-${projectId}`;

/** IDs must match what scripts/setup-appwrite.mjs provisions. */
export const DATABASE_ID = 'memoryquiz';
export const CONVERSATIONS_COLLECTION_ID = 'conversations';
export const QUIZ_ATTEMPTS_COLLECTION_ID = 'quiz_attempts';

/** Optional server-side LLM quiz generation (Appwrite Function). */
export const QUIZ_FUNCTION_ID = process.env.EXPO_PUBLIC_APPWRITE_QUIZ_FUNCTION_ID ?? null;
