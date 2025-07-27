import { Appearance } from 'react-native';
import { create } from 'zustand';

interface Conversation {
  id: string;
  title: string;
  content: string;
  tagged: boolean;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

interface AppState {
  user: { email: string; token: string } | null;
  conversations: Conversation[];
  quiz: {
    currentQuestion: number;
    score: number;
    questions: QuizQuestion[];
  };
  settings: {
    quizInterval: string;
    quizTime: string;
  };
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  login: (email: string, password: string) => void;
  logout: () => void;
  addConversation: (conversation: Conversation) => void;
  tagConversation: (id: string) => void;
  startQuiz: (conversationId: string) => void;
  answerQuestion: (selected: number) => void;
  nextQuestion: () => void;
  updateSettings: (interval: string, time: string) => void;
}

export const useQuizStore = create<AppState>((set, get) => ({
      user: null,
      conversations: [
        { id: '1', title: 'AI Basics Chat', content: 'What is AI? AI is...', tagged: false },
        { id: '2', title: 'Machine Learning Q&A', content: 'ML is...', tagged: true },
      ],
      quiz: {
        currentQuestion: 0,
        score: 0,
        questions: [
          { question: 'What is the main topic?', options: ['AI', 'Math', 'History', 'Science'], correct: 0 },
          { question: 'What does AI stand for?', options: ['Artificial Intelligence', 'Automated Interaction', 'Advanced Interface', 'None'], correct: 0 },
        ],
      },
      settings: { quizInterval: '2', quizTime: '08:00' },
      theme: Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
      setTheme: (theme) => set({ theme }),
      login: (email: string, password: string) => set({ user: { email, token: 'static-token-123' } }),
      logout: () => set({ user: null }),
      addConversation: (conversation: Conversation) =>
        set((state) => ({ conversations: [...state.conversations, conversation] })),
      tagConversation: (id: string) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, tagged: !c.tagged } : c
          ),
        })),
      startQuiz: (conversationId: string) =>
        set({ quiz: { currentQuestion: 0, score: 0, questions: get().quiz.questions } }),
      answerQuestion: (selected: number) =>
        set((state) => {
          const isCorrect = selected === state.quiz.questions[state.quiz.currentQuestion].correct;
          return { quiz: { ...state.quiz, score: isCorrect ? state.quiz.score + 10 : state.quiz.score } };
        }),
      nextQuestion: () =>
        set((state) => ({
          quiz: {
            ...state.quiz,
            currentQuestion:
              state.quiz.currentQuestion < state.quiz.questions.length - 1
                ? state.quiz.currentQuestion + 1
                : state.quiz.currentQuestion,
          },
        })),
      updateSettings: (interval: string, time: string) =>
        set({ settings: { quizInterval: interval, quizTime: time } }),
    }));