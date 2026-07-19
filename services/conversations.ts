import {
  AppwriteException,
  ID,
  Models,
  Permission,
  Query,
  Role,
} from 'react-native-appwrite';
import { CONVERSATIONS_COLLECTION_ID, DATABASE_ID, databases, QUIZ_ATTEMPTS_COLLECTION_ID } from '@/lib/appwrite';
import type { Conversation } from '@/store';
import type { MemoryState } from '@/utils/sm2';

interface ConversationDocument extends Models.Document {
  ownerId: string;
  title: string;
  content: string;
  tagged: boolean;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: string | null;
  lastReviewedAt: string | null;
  lastScorePct: number | null;
}

/**
 * True when the backend cannot serve the collection at all (not provisioned
 * yet, or offline). The app then keeps working from the local cache.
 */
export function isRemoteUnavailable(error: unknown): boolean {
  if (!(error instanceof AppwriteException)) return true; // network failure
  return (
    error.type === 'database_not_found' ||
    error.type === 'collection_not_found' ||
    error.code === 404 ||
    error.code >= 500
  );
}

function toConversation(doc: ConversationDocument): Conversation {
  return {
    id: doc.$id,
    title: doc.title,
    content: doc.content,
    tagged: doc.tagged,
    createdAt: doc.$createdAt,
    synced: true,
    memory: {
      easeFactor: doc.easeFactor,
      intervalDays: doc.intervalDays,
      repetitions: doc.repetitions,
      nextReviewAt: doc.nextReviewAt,
      lastReviewedAt: doc.lastReviewedAt,
      lastScorePct: doc.lastScorePct,
    },
  };
}

function toDocumentData(conversation: Conversation, ownerId: string) {
  return {
    ownerId,
    title: conversation.title,
    content: conversation.content,
    tagged: conversation.tagged,
    ...memoryToData(conversation.memory),
  };
}

function memoryToData(memory: MemoryState) {
  return {
    easeFactor: memory.easeFactor,
    intervalDays: memory.intervalDays,
    repetitions: memory.repetitions,
    nextReviewAt: memory.nextReviewAt,
    lastReviewedAt: memory.lastReviewedAt,
    lastScorePct: memory.lastScorePct,
  };
}

function ownerPermissions(ownerId: string): string[] {
  return [
    Permission.read(Role.user(ownerId)),
    Permission.update(Role.user(ownerId)),
    Permission.delete(Role.user(ownerId)),
  ];
}

export async function fetchRemoteConversations(ownerId: string): Promise<Conversation[]> {
  const result = await databases.listDocuments<ConversationDocument>(
    DATABASE_ID,
    CONVERSATIONS_COLLECTION_ID,
    [Query.equal('ownerId', ownerId), Query.orderDesc('$createdAt'), Query.limit(200)]
  );
  return result.documents.map(toConversation);
}

/** Pushes a locally created conversation; returns it with its remote id. */
export async function createRemoteConversation(
  conversation: Conversation,
  ownerId: string
): Promise<Conversation> {
  const doc = await databases.createDocument<ConversationDocument>(
    DATABASE_ID,
    CONVERSATIONS_COLLECTION_ID,
    ID.unique(),
    toDocumentData(conversation, ownerId),
    ownerPermissions(ownerId)
  );
  return toConversation(doc);
}

export async function updateRemoteTag(id: string, tagged: boolean): Promise<void> {
  await databases.updateDocument(DATABASE_ID, CONVERSATIONS_COLLECTION_ID, id, { tagged });
}

export async function updateRemoteMemory(id: string, memory: MemoryState): Promise<void> {
  await databases.updateDocument(
    DATABASE_ID,
    CONVERSATIONS_COLLECTION_ID,
    id,
    memoryToData(memory)
  );
}

export async function deleteRemoteConversation(id: string): Promise<void> {
  try {
    await databases.deleteDocument(DATABASE_ID, CONVERSATIONS_COLLECTION_ID, id);
  } catch (error) {
    // Already gone remotely — deletion achieved its goal.
    if (error instanceof AppwriteException && error.code === 404) return;
    throw error;
  }
}

/** Best-effort quiz attempt logging for history/analytics; never blocks UX. */
export async function recordQuizAttempt(
  ownerId: string,
  conversationId: string,
  correct: number,
  total: number
): Promise<void> {
  await databases.createDocument(
    DATABASE_ID,
    QUIZ_ATTEMPTS_COLLECTION_ID,
    ID.unique(),
    {
      ownerId,
      conversationId,
      correct,
      total,
      scorePct: total > 0 ? Math.round((correct / total) * 100) : 0,
      completedAt: new Date().toISOString(),
    },
    ownerPermissions(ownerId)
  );
}
