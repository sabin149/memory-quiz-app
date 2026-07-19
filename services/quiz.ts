import { ExecutionMethod } from 'react-native-appwrite';
import { functions, QUIZ_FUNCTION_ID } from '@/lib/appwrite';
import type { QuizQuestion } from '@/store';
import { generateClozeQuiz } from '@/utils/quizGenerator';

export type Difficulty = 'easy' | 'medium' | 'hard';
export const QUESTION_COUNTS = [5, 10, 15] as const;

export interface QuizRequest {
  /** Exactly one source: saved content, a free-form topic, or a public URL. */
  content?: string;
  topic?: string;
  url?: string;
  difficulty: Difficulty;
  count: number;
}

/** True when server-side AI generation is configured for this build. */
export function aiGenerationAvailable(): boolean {
  return QUIZ_FUNCTION_ID !== null;
}

function isValidQuestion(value: unknown): value is QuizQuestion {
  if (typeof value !== 'object' || value === null) return false;
  const q = value as Record<string, unknown>;
  return (
    typeof q.question === 'string' &&
    Array.isArray(q.options) &&
    q.options.length >= 2 &&
    q.options.every((o) => typeof o === 'string') &&
    typeof q.correct === 'number' &&
    q.correct >= 0 &&
    q.correct < q.options.length
  );
}

export interface GeneratedQuiz {
  questions: QuizQuestion[];
  /** Fetched page text for URL quizzes, so the user can save it to the library. */
  sourceText?: string;
}

async function callQuizFunction(payload: object): Promise<Record<string, unknown> | null> {
  if (!QUIZ_FUNCTION_ID) return null;
  try {
    const execution = await functions.createExecution(
      QUIZ_FUNCTION_ID,
      JSON.stringify(payload),
      false,
      undefined,
      ExecutionMethod.POST
    );
    if (execution.status !== 'completed') return null;
    return JSON.parse(execution.responseBody);
  } catch {
    return null;
  }
}

/**
 * Server-side AI generation via an Appwrite Function (comprehension-style
 * questions). The LLM API key lives in the function's environment, never in
 * the app bundle.
 */
async function generateWithFunction(request: QuizRequest): Promise<GeneratedQuiz | null> {
  const parsed = await callQuizFunction(request);
  const questions = Array.isArray(parsed?.questions) ? parsed.questions : null;
  if (!questions || questions.length === 0 || !questions.every(isValidQuestion)) return null;
  return {
    questions,
    sourceText: typeof parsed?.sourceText === 'string' ? parsed.sourceText : undefined,
  };
}

/**
 * Generates quiz questions. AI (comprehension questions) when configured;
 * saved content falls back to on-device generation so the app keeps working
 * offline. Topic/URL sources require the AI function.
 */
export async function generateQuiz(request: QuizRequest): Promise<GeneratedQuiz> {
  const fromFunction = await generateWithFunction(request);
  if (fromFunction) return fromFunction;

  if (request.content) {
    return { questions: generateClozeQuiz(request.content, request.count) };
  }
  throw new Error(
    QUIZ_FUNCTION_ID
      ? 'AI generation failed. Check the generate-quiz function: is the latest code deployed and AI_API_KEY set in ITS environment variables (not the site\u2019s)? See its Executions tab for the error.'
      : 'AI quiz generation is not configured. Deploy functions/generate-quiz and set EXPO_PUBLIC_APPWRITE_QUIZ_FUNCTION_ID.'
  );
}

/**
 * One-line AI explanation of why the picked answer is wrong (and the correct
 * one right). Returns null when the AI function isn't configured or fails —
 * the UI simply hides the feature.
 */
export async function explainAnswer(input: {
  question: string;
  options: string[];
  correct: number;
  selected: number;
  context?: string;
}): Promise<string | null> {
  const parsed = await callQuizFunction({ explain: input });
  const explanation = parsed?.explanation;
  return typeof explanation === 'string' && explanation.trim() ? explanation.trim() : null;
}
