/**
 * Provisions the Appwrite database schema for Memory Quiz App.
 * Idempotent: safe to re-run; existing resources are left untouched.
 *
 * Usage:
 *   APPWRITE_API_KEY=<server key with databases.write scope> node scripts/setup-appwrite.mjs
 *
 * Endpoint/project are read from .env (EXPO_PUBLIC_APPWRITE_*) or the
 * environment. The API key must NEVER be committed or put in .env — pass it
 * inline or export it in your shell for the one run.
 */
import { readFileSync } from 'node:fs';
import { Client, Databases, Permission, Role } from 'node-appwrite';

const DATABASE_ID = 'memoryquiz';
const CONVERSATIONS = 'conversations';
const QUIZ_ATTEMPTS = 'quiz_attempts';

function loadDotEnv() {
  try {
    for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
      const match = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
      if (match && !(match[1] in process.env)) process.env[match[1]] = match[2];
    }
  } catch {
    // no .env file; rely on the environment
  }
}

loadDotEnv();

const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

if (!endpoint || !projectId || !apiKey) {
  console.error(
    'Missing configuration. Required: EXPO_PUBLIC_APPWRITE_ENDPOINT, EXPO_PUBLIC_APPWRITE_PROJECT_ID (env or .env) and APPWRITE_API_KEY (env only).'
  );
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);

/** Runs an operation, ignoring "already exists" (409) conflicts. */
async function ensure(label, operation) {
  try {
    await operation();
    console.log(`created: ${label}`);
  } catch (error) {
    if (error?.code === 409) {
      console.log(`exists:  ${label}`);
    } else {
      throw error;
    }
  }
}

async function main() {
  await ensure(`database ${DATABASE_ID}`, () =>
    databases.create(DATABASE_ID, 'Memory Quiz')
  );

  await ensure(`collection ${CONVERSATIONS}`, () =>
    databases.createCollection(
      DATABASE_ID,
      CONVERSATIONS,
      'Conversations',
      [Permission.create(Role.users())],
      true // document security: owners get per-document read/update/delete
    )
  );
  await ensure(`${CONVERSATIONS}.ownerId`, () =>
    databases.createStringAttribute(DATABASE_ID, CONVERSATIONS, 'ownerId', 64, true)
  );
  await ensure(`${CONVERSATIONS}.title`, () =>
    databases.createStringAttribute(DATABASE_ID, CONVERSATIONS, 'title', 256, true)
  );
  await ensure(`${CONVERSATIONS}.content`, () =>
    databases.createStringAttribute(DATABASE_ID, CONVERSATIONS, 'content', 65535, true)
  );
  await ensure(`${CONVERSATIONS}.tagged`, () =>
    databases.createBooleanAttribute(DATABASE_ID, CONVERSATIONS, 'tagged', false, false)
  );
  await ensure(`${CONVERSATIONS}.easeFactor`, () =>
    databases.createFloatAttribute(DATABASE_ID, CONVERSATIONS, 'easeFactor', false, 1.3, 5, 2.5)
  );
  await ensure(`${CONVERSATIONS}.intervalDays`, () =>
    databases.createFloatAttribute(DATABASE_ID, CONVERSATIONS, 'intervalDays', false, 0, 3650, 0)
  );
  await ensure(`${CONVERSATIONS}.repetitions`, () =>
    databases.createIntegerAttribute(DATABASE_ID, CONVERSATIONS, 'repetitions', false, 0, 10000, 0)
  );
  await ensure(`${CONVERSATIONS}.nextReviewAt`, () =>
    databases.createDatetimeAttribute(DATABASE_ID, CONVERSATIONS, 'nextReviewAt', false)
  );
  await ensure(`${CONVERSATIONS}.lastReviewedAt`, () =>
    databases.createDatetimeAttribute(DATABASE_ID, CONVERSATIONS, 'lastReviewedAt', false)
  );
  await ensure(`${CONVERSATIONS}.lastScorePct`, () =>
    databases.createIntegerAttribute(DATABASE_ID, CONVERSATIONS, 'lastScorePct', false, 0, 100)
  );

  await ensure(`collection ${QUIZ_ATTEMPTS}`, () =>
    databases.createCollection(
      DATABASE_ID,
      QUIZ_ATTEMPTS,
      'Quiz Attempts',
      [Permission.create(Role.users())],
      true
    )
  );
  await ensure(`${QUIZ_ATTEMPTS}.ownerId`, () =>
    databases.createStringAttribute(DATABASE_ID, QUIZ_ATTEMPTS, 'ownerId', 64, true)
  );
  await ensure(`${QUIZ_ATTEMPTS}.conversationId`, () =>
    databases.createStringAttribute(DATABASE_ID, QUIZ_ATTEMPTS, 'conversationId', 64, true)
  );
  await ensure(`${QUIZ_ATTEMPTS}.correct`, () =>
    databases.createIntegerAttribute(DATABASE_ID, QUIZ_ATTEMPTS, 'correct', true, 0, 1000)
  );
  await ensure(`${QUIZ_ATTEMPTS}.total`, () =>
    databases.createIntegerAttribute(DATABASE_ID, QUIZ_ATTEMPTS, 'total', true, 0, 1000)
  );
  await ensure(`${QUIZ_ATTEMPTS}.scorePct`, () =>
    databases.createIntegerAttribute(DATABASE_ID, QUIZ_ATTEMPTS, 'scorePct', true, 0, 100)
  );
  await ensure(`${QUIZ_ATTEMPTS}.completedAt`, () =>
    databases.createDatetimeAttribute(DATABASE_ID, QUIZ_ATTEMPTS, 'completedAt', true)
  );

  // Attributes must finish processing before indexes can reference them.
  console.log('waiting for attributes to be available…');
  await new Promise((resolve) => setTimeout(resolve, 3000));

  await ensure(`${CONVERSATIONS} index owner_created`, () =>
    databases.createIndex(DATABASE_ID, CONVERSATIONS, 'owner_created', 'key', ['ownerId', '$createdAt'])
  );
  await ensure(`${QUIZ_ATTEMPTS} index owner_completed`, () =>
    databases.createIndex(DATABASE_ID, QUIZ_ATTEMPTS, 'owner_completed', 'key', ['ownerId', 'completedAt'])
  );

  console.log('done.');
}

main().catch((error) => {
  console.error('Provisioning failed:', error?.message ?? error);
  process.exit(1);
});
