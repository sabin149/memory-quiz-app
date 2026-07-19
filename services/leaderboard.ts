import { AppwriteException, Models, Permission, Query, Role } from 'react-native-appwrite';
import { DATABASE_ID, databases } from '@/lib/appwrite';
import type { User } from '@/services/auth';
import { computeStreak, GamificationState, levelFromXp } from '@/utils/gamification';

const LEADERBOARD_COLLECTION_ID = 'leaderboard';

export interface LeaderboardEntry extends Models.Document {
  name: string;
  totalXp: number;
  streak: number;
  level: number;
  quizzes: number;
}

function toData(user: User, gamification: GamificationState) {
  return {
    // First name only: opted-in users share progress, not identity.
    name: (user.name || 'Learner').split(' ')[0].slice(0, 64),
    totalXp: gamification.totalXp,
    streak: computeStreak(gamification.activity),
    level: levelFromXp(gamification.totalXp).level,
    quizzes: gamification.quizzesCompleted,
  };
}

/** Creates or updates the caller's single entry (doc id = user id). */
export async function upsertLeaderboardEntry(
  user: User,
  gamification: GamificationState
): Promise<void> {
  const data = toData(user, gamification);
  try {
    await databases.updateDocument(DATABASE_ID, LEADERBOARD_COLLECTION_ID, user.$id, data);
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 404) {
      await databases.createDocument(DATABASE_ID, LEADERBOARD_COLLECTION_ID, user.$id, data, [
        // Explicit per-document read: collection-level read("users") does not
        // reliably apply to other users' documents under document security.
        Permission.read(Role.users()),
        Permission.update(Role.user(user.$id)),
        Permission.delete(Role.user(user.$id)),
      ]);
      return;
    }
    throw error;
  }
}

/** Opting out removes the entry entirely. */
export async function removeLeaderboardEntry(userId: string): Promise<void> {
  try {
    await databases.deleteDocument(DATABASE_ID, LEADERBOARD_COLLECTION_ID, userId);
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 404) return;
    throw error;
  }
}

export async function fetchLeaderboard(
  orderBy: 'totalXp' | 'streak'
): Promise<LeaderboardEntry[]> {
  const result = await databases.listDocuments<LeaderboardEntry>(
    DATABASE_ID,
    LEADERBOARD_COLLECTION_ID,
    [Query.orderDesc(orderBy), Query.limit(50)]
  );
  return result.documents;
}
