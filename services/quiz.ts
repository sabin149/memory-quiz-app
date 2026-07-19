import { ExecutionMethod } from 'react-native-appwrite';
import { functions, QUIZ_FUNCTION_ID } from '@/lib/appwrite';
import type { Conversation, QuizQuestion } from '@/store';
import { generateClozeQuiz } from '@/utils/quizGenerator';

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
 * Server-side LLM generation via an Appwrite Function. The LLM API key lives
 * in the function's environment, never in the app bundle.
 */
async function generateWithFunction(conversation: Conversation): Promise<QuizQuestion[] | null> {
  if (!QUIZ_FUNCTION_ID) return null;
  try {
    const execution = await functions.createExecution(
      QUIZ_FUNCTION_ID,
      JSON.stringify({ title: conversation.title, content: conversation.content }),
      false,
      undefined,
      ExecutionMethod.POST
    );
    if (execution.status !== 'completed') return null;
    const parsed = JSON.parse(execution.responseBody);
    const questions = Array.isArray(parsed?.questions) ? parsed.questions : null;
    if (!questions || !questions.every(isValidQuestion)) return null;
    return questions;
  } catch {
    return null; // fall back to on-device generation
  }
}

/**
 * Generates quiz questions for a conversation: LLM function when configured,
 * on-device cloze-deletion otherwise. Returns [] when the content is too
 * short to build any question from.
 */
export async function generateQuiz(conversation: Conversation): Promise<QuizQuestion[]> {
  const fromFunction = await generateWithFunction(conversation);
  if (fromFunction && fromFunction.length > 0) return fromFunction;
  return generateClozeQuiz(conversation.content);
}
