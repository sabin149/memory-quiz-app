import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme } from 'nativewind';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { saveGamificationPrefs, User } from '@/services/auth';
import { trackEvent } from '@/services/analytics';
import {
  EMPTY_GAMIFICATION,
  GamificationState,
  mergeGamification,
  recordQuizActivity,
} from '@/utils/gamification';
import {
  createRemoteConversation,
  deleteRemoteConversation,
  fetchRemoteConversations,
  isRemoteUnavailable,
  recordQuizAttempt,
  updateRemoteMemory,
  updateRemoteTag,
} from '@/services/conversations';
import { scheduleQuizReminder } from '@/services/notifications';
import { initialMemory, isDue, MemoryState, reviewMemory } from '@/utils/sm2';

export interface Conversation {
  id: string;
  title: string;
  content: string;
  tagged: boolean;
  createdAt: string;
  /** True once the conversation exists in Appwrite (id is the document id). */
  synced: boolean;
  memory: MemoryState;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

export type QuizStatus = 'idle' | 'active' | 'finished';

interface QuizState {
  conversationId: string | null;
  status: QuizStatus;
  currentQuestion: number;
  score: number;
  answers: (number | null)[];
  questions: QuizQuestion[];
}

interface Settings {
  quizIntervalDays: number;
  quizTime: string; // HH:MM, 24h
}

export type ThemePreference = 'system' | 'light' | 'dark';

const EMPTY_QUIZ: QuizState = {
  conversationId: null,
  status: 'idle',
  currentQuestion: 0,
  score: 0,
  answers: [],
  questions: [],
};

interface AppState {
  user: User | null;
  authReady: boolean;
  /** Member of the Appwrite "admins" team; unlocks the admin portal. */
  isAdmin: boolean;
  conversations: Conversation[];
  /** Remote ids deleted locally while the backend was unreachable. */
  pendingDeletes: string[];
  /** False when Appwrite Databases is unreachable or not provisioned. */
  remoteAvailable: boolean;
  lastQuizCompletedAt: string | null;
  quiz: QuizState;
  settings: Settings;
  theme: ThemePreference;
  gamification: GamificationState;
  hasOnboarded: boolean;
  setHasOnboarded: (done: boolean) => void;
  setUser: (user: User | null) => void;
  setAuthReady: (ready: boolean) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setTheme: (theme: ThemePreference) => void;
  /** Merges gamification synced from Appwrite account prefs (cross-device). */
  hydrateGamification: (remote: unknown) => void;
  /** Clears all user-owned local data; call on logout/account deletion. */
  clearUserData: () => void;
  /** Pulls remote conversations and pushes local-only changes. */
  syncConversations: () => Promise<void>;
  addConversation: (input: { title: string; content: string }) => Promise<void>;
  removeConversation: (id: string) => void;
  tagConversation: (id: string) => void;
  startQuiz: (conversationId: string, questions: QuizQuestion[]) => void;
  answerQuestion: (selected: number) => void;
  nextQuestion: () => void;
  resetQuiz: () => void;
  /** Applies SM-2 to the conversation and reschedules the reminder. */
  applyQuizResult: (conversationId: string, correct: number, total: number) => Promise<void>;
  updateSettings: (settings: Settings) => Promise<void>;
  dueCount: () => number;
}

export const useQuizStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      authReady: false,
      isAdmin: false,
      conversations: [],
      pendingDeletes: [],
      remoteAvailable: false,
      lastQuizCompletedAt: null,
      quiz: EMPTY_QUIZ,
      settings: { quizIntervalDays: 2, quizTime: '08:00' },
      theme: 'system',
      gamification: EMPTY_GAMIFICATION,
      hasOnboarded: false,

      setHasOnboarded: (hasOnboarded) => set({ hasOnboarded }),
      setUser: (user) => set(user ? { user } : { user: null, isAdmin: false }),
      setAuthReady: (authReady) => set({ authReady }),
      setIsAdmin: (isAdmin) => set({ isAdmin }),

      setTheme: (theme) => {
        set({ theme });
        colorScheme.set(theme);
      },

      hydrateGamification: (remote) => {
        if (!remote || typeof remote !== 'object') return;
        const r = remote as Partial<GamificationState>;
        const normalized: GamificationState = {
          totalXp: typeof r.totalXp === 'number' ? r.totalXp : 0,
          quizzesCompleted: typeof r.quizzesCompleted === 'number' ? r.quizzesCompleted : 0,
          perfectQuizzes: typeof r.perfectQuizzes === 'number' ? r.perfectQuizzes : 0,
          activity: r.activity && typeof r.activity === 'object' ? (r.activity as Record<string, number>) : {},
        };
        set((state) => ({ gamification: mergeGamification(state.gamification, normalized) }));
      },

      clearUserData: () =>
        set({
          user: null,
          isAdmin: false,
          conversations: [],
          pendingDeletes: [],
          remoteAvailable: false,
          lastQuizCompletedAt: null,
          quiz: EMPTY_QUIZ,
          gamification: EMPTY_GAMIFICATION,
        }),

      syncConversations: async () => {
        const { user, conversations, pendingDeletes } = get();
        if (!user) return;
        try {
          for (const id of pendingDeletes) {
            await deleteRemoteConversation(id);
          }
          // Push conversations created while offline, then pull everything.
          for (const conversation of conversations.filter((c) => !c.synced)) {
            await createRemoteConversation(conversation, user.$id);
          }
          const remote = await fetchRemoteConversations(user.$id);
          set({
            conversations: remote.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
            pendingDeletes: [],
            remoteAvailable: true,
          });
        } catch (error) {
          if (isRemoteUnavailable(error)) {
            set({ remoteAvailable: false });
          } else {
            console.warn('Conversation sync failed', error);
          }
        }
      },

      addConversation: async (input) => {
        const { user } = get();
        const local: Conversation = {
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title: input.title,
          content: input.content,
          tagged: false,
          createdAt: new Date().toISOString(),
          synced: false,
          memory: initialMemory(),
        };
        set((state) => ({ conversations: [local, ...state.conversations] }));

        if (!user) return;
        trackEvent(user.$id, 'conversation_created');
        try {
          const remote = await createRemoteConversation(local, user.$id);
          set((state) => ({
            conversations: state.conversations.map((c) => (c.id === local.id ? remote : c)),
            remoteAvailable: true,
          }));
        } catch (error) {
          if (isRemoteUnavailable(error)) set({ remoteAvailable: false });
          else console.warn('Failed to push conversation', error);
        }
      },

      removeConversation: (id) => {
        const { user } = get();
        if (user) trackEvent(user.$id, 'conversation_deleted');
        const target = get().conversations.find((c) => c.id === id);
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          pendingDeletes:
            target?.synced && !state.pendingDeletes.includes(id)
              ? [...state.pendingDeletes, id]
              : state.pendingDeletes,
        }));
        if (target?.synced) {
          deleteRemoteConversation(id)
            .then(() =>
              set((state) => ({
                pendingDeletes: state.pendingDeletes.filter((d) => d !== id),
              }))
            )
            .catch(() => {
              // Stays in pendingDeletes; retried on next sync.
            });
        }
      },

      tagConversation: (id) => {
        const target = get().conversations.find((c) => c.id === id);
        if (!target) return;
        const tagged = !target.tagged;
        set((state) => ({
          conversations: state.conversations.map((c) => (c.id === id ? { ...c, tagged } : c)),
        }));
        if (target.synced) {
          updateRemoteTag(id, tagged).catch(() => {
            // Local state is the user's intent; retried implicitly on next sync.
          });
        }
      },

      startQuiz: (conversationId, questions) =>
        set({
          quiz: {
            conversationId,
            status: 'active',
            currentQuestion: 0,
            score: 0,
            answers: [],
            questions,
          },
        }),

      answerQuestion: (selected) =>
        set((state) => {
          const { quiz } = state;
          if (quiz.status !== 'active' || quiz.answers[quiz.currentQuestion] != null) {
            return state;
          }
          const isCorrect = selected === quiz.questions[quiz.currentQuestion].correct;
          const answers = [...quiz.answers];
          answers[quiz.currentQuestion] = selected;
          return {
            quiz: {
              ...quiz,
              answers,
              score: isCorrect ? quiz.score + 10 : quiz.score,
            },
          };
        }),

      nextQuestion: () =>
        set((state) => {
          const { quiz } = state;
          const isLast = quiz.currentQuestion >= quiz.questions.length - 1;
          return {
            quiz: isLast
              ? { ...quiz, status: 'finished' }
              : { ...quiz, currentQuestion: quiz.currentQuestion + 1 },
          };
        }),

      resetQuiz: () => set({ quiz: EMPTY_QUIZ }),

      applyQuizResult: async (conversationId, correct, total) => {
        const { user, conversations, settings } = get();
        const target = conversations.find((c) => c.id === conversationId);
        if (!target || total === 0) return;

        const scorePct = Math.round((correct / total) * 100);
        const memory = reviewMemory(target.memory, scorePct);
        const completedAt = new Date().toISOString();
        const gamification = recordQuizActivity(get().gamification, correct, total);

        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId ? { ...c, memory } : c
          ),
          lastQuizCompletedAt: completedAt,
          gamification,
        }));

        if (user) {
          trackEvent(user.$id, 'quiz_completed');
          saveGamificationPrefs(gamification); // cross-device sync, best effort
          if (target.synced) {
            updateRemoteMemory(conversationId, memory).catch(() => {});
            recordQuizAttempt(user.$id, conversationId, correct, total).catch(() => {});
          }
        }

        await scheduleQuizReminder(settings, completedAt, get().dueCount());
      },

      updateSettings: async (settings) => {
        const { user } = get();
        if (user) trackEvent(user.$id, 'settings_updated');
        set({ settings });
        await scheduleQuizReminder(settings, get().lastQuizCompletedAt, get().dueCount());
      },

      dueCount: () => get().conversations.filter((c) => isDue(c.memory)).length,
    }),
    {
      name: 'memory-quiz-store',
      storage: createJSONStorage(() => AsyncStorage),
      // user/session is owned by Appwrite; quiz progress is transient
      partialize: (state) => ({
        conversations: state.conversations,
        pendingDeletes: state.pendingDeletes,
        lastQuizCompletedAt: state.lastQuizCompletedAt,
        settings: state.settings,
        theme: state.theme,
        gamification: state.gamification,
        hasOnboarded: state.hasOnboarded,
      }),
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        // v1 conversations lack memory/synced fields; backfill them.
        const state = persisted as {
          conversations?: (Partial<Conversation> & { id: string })[];
        } & Record<string, unknown>;
        if (version < 2 && Array.isArray(state?.conversations)) {
          state.conversations = state.conversations.map((c) => ({
            ...c,
            synced: c.synced ?? false,
            memory: c.memory ?? initialMemory(),
          }));
        }
        return state;
      },
    }
  )
);
