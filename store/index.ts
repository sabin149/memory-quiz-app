import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { User } from '@/services/auth';

export interface Conversation {
  id: string;
  title: string;
  content: string;
  tagged: boolean;
  createdAt: string;
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

const EMPTY_QUIZ: QuizState = {
  conversationId: null,
  status: 'idle',
  currentQuestion: 0,
  score: 0,
  answers: [],
  questions: [],
};

// Placeholder question set until content-based generation lands (Phase 3).
const SAMPLE_QUESTIONS: QuizQuestion[] = [
  {
    question: 'What is the main topic?',
    options: ['AI', 'Math', 'History', 'Science'],
    correct: 0,
  },
  {
    question: 'What does AI stand for?',
    options: ['Artificial Intelligence', 'Automated Interaction', 'Advanced Interface', 'None'],
    correct: 0,
  },
];

interface AppState {
  user: User | null;
  authReady: boolean;
  conversations: Conversation[];
  quiz: QuizState;
  settings: Settings;
  setUser: (user: User | null) => void;
  setAuthReady: (ready: boolean) => void;
  addConversation: (conversation: Conversation) => void;
  removeConversation: (id: string) => void;
  tagConversation: (id: string) => void;
  startQuiz: (conversationId: string) => void;
  answerQuestion: (selected: number) => void;
  nextQuestion: () => void;
  resetQuiz: () => void;
  updateSettings: (settings: Settings) => void;
}

export const useQuizStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      authReady: false,
      conversations: [],
      quiz: EMPTY_QUIZ,
      settings: { quizIntervalDays: 2, quizTime: '08:00' },

      setUser: (user) => set({ user }),
      setAuthReady: (authReady) => set({ authReady }),

      addConversation: (conversation) =>
        set((state) => ({ conversations: [conversation, ...state.conversations] })),

      removeConversation: (id) =>
        set((state) => ({ conversations: state.conversations.filter((c) => c.id !== id) })),

      tagConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, tagged: !c.tagged } : c
          ),
        })),

      startQuiz: (conversationId) =>
        set({
          quiz: {
            conversationId,
            status: 'active',
            currentQuestion: 0,
            score: 0,
            answers: [],
            questions: SAMPLE_QUESTIONS,
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

      updateSettings: (settings) => set({ settings }),
    }),
    {
      name: 'memory-quiz-store',
      storage: createJSONStorage(() => AsyncStorage),
      // user/session is owned by Appwrite; quiz progress is transient
      partialize: (state) => ({
        conversations: state.conversations,
        settings: state.settings,
      }),
    }
  )
);
