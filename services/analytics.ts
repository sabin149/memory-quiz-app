import { ID, Models, Query } from 'react-native-appwrite';
import { DATABASE_ID, databases } from '@/lib/appwrite';

const EVENTS_COLLECTION_ID = 'events';

/**
 * Privacy-safe analytics: only an event name, the owner's user id, and the
 * server-side timestamp are stored — never content, emails, or device data.
 */
export type AnalyticsEventName =
  | 'app_opened'
  | 'login'
  | 'register'
  | 'oauth_login'
  | 'conversation_created'
  | 'conversation_deleted'
  | 'quiz_completed'
  | 'settings_updated';

export interface AnalyticsEvent extends Models.Document {
  name: AnalyticsEventName;
  ownerId: string;
}

/** Fire-and-forget; analytics must never block or break the UX. */
export function trackEvent(ownerId: string, name: AnalyticsEventName): void {
  databases
    .createDocument(DATABASE_ID, EVENTS_COLLECTION_ID, ID.unique(), { name, ownerId })
    .catch(() => {
      // Backend unreachable or not provisioned; drop the event silently.
    });
}

const PAGE_SIZE = 100;
const MAX_PAGES = 20;

/** Admin-only (requires "admins" team read permission on the collection). */
export async function fetchEventsSince(since: Date): Promise<AnalyticsEvent[]> {
  const events: AnalyticsEvent[] = [];
  let cursor: string | null = null;

  for (let page = 0; page < MAX_PAGES; page++) {
    const queries = [
      Query.greaterThan('$createdAt', since.toISOString()),
      Query.orderDesc('$createdAt'),
      Query.limit(PAGE_SIZE),
    ];
    if (cursor) queries.push(Query.cursorAfter(cursor));

    const result = await databases.listDocuments<AnalyticsEvent>(
      DATABASE_ID,
      EVENTS_COLLECTION_ID,
      queries
    );
    events.push(...result.documents);
    if (result.documents.length < PAGE_SIZE) break;
    cursor = result.documents[result.documents.length - 1].$id;
  }

  return events;
}
