import type { QuizQuestion } from '@/store';

/**
 * On-device quiz generation: cloze-deletion (fill-in-the-blank) multiple
 * choice questions built from the conversation's own sentences. Used as the
 * offline/free-tier fallback when no server-side LLM function is configured.
 */

const DEFAULT_MAX_QUESTIONS = 5;
const OPTIONS_PER_QUESTION = 4;

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'while',
  'this', 'that', 'these', 'those', 'there', 'here', 'with', 'without', 'from',
  'into', 'onto', 'over', 'under', 'about', 'after', 'before', 'between',
  'because', 'through', 'during', 'above', 'below', 'again', 'very', 'just',
  'both', 'each', 'more', 'most', 'other', 'some', 'such', 'only', 'same',
  'than', 'them', 'they', 'their', 'theirs', 'your', 'yours', 'ours', 'what',
  'which', 'whose', 'whom', 'where', 'will', 'would', 'could', 'should',
  'shall', 'might', 'must', 'have', 'has', 'had', 'been', 'being', 'were',
  'does', 'doing', 'done', 'also', 'like', 'make', 'makes', 'made', 'using',
  'used', 'uses', 'can', 'cannot', 'not', 'you', 'are', 'was', 'for', 'its',
  'his', 'her', 'him', 'she', 'who', 'how', 'why', 'all', 'any', 'may', 'our',
]);

function splitSentences(content: string): string[] {
  // Avoids regex lookbehind for compatibility with older JS engines.
  const matches = content.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]*/g) ?? [];
  return matches.map((s) => s.trim()).filter((s) => s.split(' ').length >= 5);
}

function isKeywordCandidate(word: string): boolean {
  const clean = word.replace(/[^\p{L}\p{N}-]/gu, '');
  return clean.length >= 4 && !STOPWORDS.has(clean.toLowerCase());
}

/** Picks the most "informative" word of a sentence: longest non-stopword. */
function pickKeyword(sentence: string): string | null {
  const candidates = sentence
    .split(' ')
    .map((w) => w.replace(/[^\p{L}\p{N}-]/gu, ''))
    .filter(isKeywordCandidate);
  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => b.length - a.length)[0];
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const GENERIC_DISTRACTORS = ['process', 'system', 'concept', 'method', 'result', 'context'];

const MAX_STATEMENT_LENGTH = 160;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildDistractors(keyword: string, keywordPool: Set<string>): string[] {
  const distractors = shuffle(
    [...keywordPool].filter((w) => w.toLowerCase() !== keyword.toLowerCase() && w.length >= 3)
  ).slice(0, OPTIONS_PER_QUESTION - 1);
  // Pad with generic terms when the text is too short to supply distractors.
  for (const generic of GENERIC_DISTRACTORS) {
    if (distractors.length >= OPTIONS_PER_QUESTION - 1) break;
    if (generic.toLowerCase() !== keyword.toLowerCase() && !distractors.includes(generic)) {
      distractors.push(generic);
    }
  }
  return distractors;
}

function makeClozeQuestion(
  sentence: string,
  keyword: string,
  keywordPool: Set<string>
): QuizQuestion | null {
  const distractors = buildDistractors(keyword, keywordPool);
  if (distractors.length < OPTIONS_PER_QUESTION - 1) return null;

  const blanked = sentence.replace(new RegExp(`\\b${escapeRegExp(keyword)}\\b`), '_____');
  if (!blanked.includes('_____')) return null;

  const options = shuffle([keyword, ...distractors]);
  return {
    question: `Fill in the blank: ${blanked}`,
    options,
    correct: options.indexOf(keyword),
  };
}

/**
 * "Which statement matches your notes?" — the true sentence against corrupted
 * variants (key term swapped), which tests recognition of meaning rather than
 * a single word.
 */
function makeStatementQuestion(
  sentence: string,
  keyword: string,
  keywordPool: Set<string>
): QuizQuestion | null {
  if (sentence.length > MAX_STATEMENT_LENGTH) return null;
  const distractorWords = buildDistractors(keyword, keywordPool);
  if (distractorWords.length < OPTIONS_PER_QUESTION - 1) return null;

  const keywordPattern = new RegExp(`\\b${escapeRegExp(keyword)}\\b`);
  const corrupted = distractorWords.map((w) => sentence.replace(keywordPattern, w));
  if (corrupted.some((c) => c === sentence)) return null;

  const options = shuffle([sentence, ...corrupted]);
  return {
    question: 'Which of these statements matches your notes?',
    options,
    correct: options.indexOf(sentence),
  };
}

export function generateClozeQuiz(
  content: string,
  maxQuestions: number = DEFAULT_MAX_QUESTIONS
): QuizQuestion[] {
  const sentences = splitSentences(content);

  // Keyword pool across the whole text, used to build plausible distractors.
  const keywordPool = new Set<string>();
  for (const sentence of sentences) {
    for (const word of sentence.split(' ')) {
      const clean = word.replace(/[^\p{L}\p{N}-]/gu, '');
      if (isKeywordCandidate(clean)) keywordPool.add(clean);
    }
  }

  const questions: QuizQuestion[] = [];
  const usedKeywords = new Set<string>();

  for (const sentence of shuffle(sentences)) {
    if (questions.length >= maxQuestions) break;

    const keyword = pickKeyword(sentence);
    if (!keyword || usedKeywords.has(keyword.toLowerCase())) continue;
    usedKeywords.add(keyword.toLowerCase());

    // Alternate question styles for variety; fall back to the other type.
    const preferStatement = questions.length % 2 === 1;
    const question = preferStatement
      ? (makeStatementQuestion(sentence, keyword, keywordPool) ??
        makeClozeQuestion(sentence, keyword, keywordPool))
      : (makeClozeQuestion(sentence, keyword, keywordPool) ??
        makeStatementQuestion(sentence, keyword, keywordPool));
    if (question) questions.push(question);
  }

  return questions;
}
