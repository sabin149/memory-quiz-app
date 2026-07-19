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

/**
 * Server-side AI generation via an Appwrite Function (comprehension-style
 * questions). The LLM API key lives in the function's environment, never in
 * the app bundle.
 */
async function generateWithFunction(request: QuizRequest): Promise<QuizQuestion[] | null> {
  if (!QUIZ_FUNCTION_ID) return null;
  try {
    const execution = await functions.createExecution(
      QUIZ_FUNCTION_ID,
      JSON.stringify(request),
      false,
      undefined,
      ExecutionMethod.POST
    );
    if (execution.status !== 'completed') return null;
    const parsed = JSON.parse(execution.responseBody);
    const questions = Array.isArray(parsed?.questions) ? parsed.questions : null;
    if (!questions || questions.length === 0 || !questions.every(isValidQuestion)) return null;
    return questions;
  } catch {
    return null; // fall back where possible
  }
}

/**
 * Generates quiz questions. AI (comprehension questions) when configured;
 * saved content falls back to on-device generation so the app keeps working
 * offline. Topic/URL sources require the AI function.
 */
export async function generateQuiz(request: QuizRequest): Promise<QuizQuestion[]> {
  const fromFunction = await generateWithFunction(request);
  if (fromFunction) return fromFunction;

  if (request.content) {
    return generateClozeQuiz(request.content, request.count);
  }
  throw new Error(
    'AI quiz generation is not configured. Deploy functions/generate-quiz and set EXPO_PUBLIC_APPWRITE_QUIZ_FUNCTION_ID.'
  );
}
