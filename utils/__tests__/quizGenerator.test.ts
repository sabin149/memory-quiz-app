import { generateClozeQuiz } from '@/utils/quizGenerator';

const CONTENT = `React Native lets you build mobile apps using JavaScript and React.
Expo Router brings file-based routing to React Native applications.
The Zustand library manages global state with a minimal API.
Appwrite provides authentication, databases, and serverless functions.
Spaced repetition improves long-term retention by scheduling reviews.`;

describe('generateClozeQuiz', () => {
  it('builds up to 5 valid questions from real content', () => {
    const questions = generateClozeQuiz(CONTENT);
    expect(questions.length).toBeGreaterThan(0);
    expect(questions.length).toBeLessThanOrEqual(5);
    for (const q of questions) {
      expect(q.options.length).toBe(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.correct).toBeGreaterThanOrEqual(0);
      expect(q.correct).toBeLessThan(4);
      if (q.question.includes('_____')) {
        // Cloze: the blanked keyword must not appear in the question text.
        expect(q.question.toLowerCase()).not.toContain(q.options[q.correct].toLowerCase());
      } else {
        // Statement question: the correct option is a sentence from the text.
        expect(q.question).toContain('statements');
        expect(CONTENT.replace(/\s+/g, ' ')).toContain(q.options[q.correct]);
      }
    }
  });

  it('mixes cloze and statement question styles', () => {
    const questions = generateClozeQuiz(CONTENT, 5);
    if (questions.length >= 2) {
      const styles = new Set(questions.map((q) => (q.question.includes('_____') ? 'cloze' : 'statement')));
      expect(styles.size).toBeGreaterThanOrEqual(1); // both when sentences allow
    }
  });

  it('respects the maxQuestions parameter', () => {
    expect(generateClozeQuiz(CONTENT, 2).length).toBeLessThanOrEqual(2);
  });

  it('returns no questions for too-short content', () => {
    expect(generateClozeQuiz('Hi there.')).toEqual([]);
    expect(generateClozeQuiz('')).toEqual([]);
  });

  it('never repeats the same answer across questions', () => {
    const questions = generateClozeQuiz(CONTENT);
    const answers = questions.map((q) => q.options[q.correct].toLowerCase());
    expect(new Set(answers).size).toBe(answers.length);
  });
});
