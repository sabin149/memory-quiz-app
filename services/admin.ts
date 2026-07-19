import { Models, Query, Teams } from 'react-native-appwrite';
import { client, DATABASE_ID, databases, QUIZ_ATTEMPTS_COLLECTION_ID } from '@/lib/appwrite';

const ADMINS_TEAM_ID = 'admins';

const teams = new Teams(client);

/** True when the logged-in user belongs to the "admins" Appwrite team. */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    const result = await teams.list([Query.equal('$id', ADMINS_TEAM_ID)]);
    return result.teams.length > 0;
  } catch {
    return false;
  }
}

export interface QuizAttemptDoc extends Models.Document {
  ownerId: string;
  conversationId: string;
  correct: number;
  total: number;
  scorePct: number;
  completedAt: string;
}

const PAGE_SIZE = 100;
const MAX_PAGES = 20;

/** Admin-only: quiz attempts across all users (scores only, no content). */
export async function fetchAttemptsSince(since: Date): Promise<QuizAttemptDoc[]> {
  const attempts: QuizAttemptDoc[] = [];
  let cursor: string | null = null;

  for (let page = 0; page < MAX_PAGES; page++) {
    const queries = [
      Query.greaterThan('completedAt', since.toISOString()),
      Query.orderDesc('completedAt'),
      Query.limit(PAGE_SIZE),
    ];
    if (cursor) queries.push(Query.cursorAfter(cursor));

    const result = await databases.listDocuments<QuizAttemptDoc>(
      DATABASE_ID,
      QUIZ_ATTEMPTS_COLLECTION_ID,
      queries
    );
    attempts.push(...result.documents);
    if (result.documents.length < PAGE_SIZE) break;
    cursor = result.documents[result.documents.length - 1].$id;
  }

  return attempts;
}
