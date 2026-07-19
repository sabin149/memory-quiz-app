import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import Button from '@/components/ui/Button';
import { aiGenerationAvailable, Difficulty, explainAnswer, generateQuiz } from '@/services/quiz';
import { useQuizStore } from '@/store';
import { xpForQuiz } from '@/utils/gamification';
import type { Confidence } from '@/utils/sm2';

function answerFeedback(correct: boolean) {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(
    correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
  ).catch(() => {});
}

const CONFIDENCE_OPTIONS: { value: Confidence; labelKey: string }[] = [
  { value: 'guessed', labelKey: 'quiz.guessed' },
  { value: 'hesitant', labelKey: 'quiz.hesitant' },
  { value: 'knew', labelKey: 'quiz.knewIt' },
];

export default function QuizScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    conversationId?: string;
    topic?: string;
    url?: string;
    difficulty?: Difficulty;
    count?: string;
  }>();
  const {
    quiz,
    conversations,
    startQuiz,
    answerQuestion,
    setConfidence,
    nextQuestion,
    resetQuiz,
    applyQuizResult,
    addConversation,
  } = useQuizStore();
  const router = useRouter();
  const [generating, setGenerating] = useState(true);
  const [genError, setGenError] = useState<string | null>(null);
  const [sourceText, setSourceText] = useState<string | undefined>();
  const [explanations, setExplanations] = useState<Record<number, string>>({});
  const [explaining, setExplaining] = useState(false);
  const [savedToLibrary, setSavedToLibrary] = useState(false);
  const recordedRef = useRef(false);

  const conversation = conversations.find((c) => c.id === params.conversationId);
  const sourceTitle =
    conversation?.title ??
    (params.topic ? `Topic: ${params.topic}` : params.url ? params.url : 'Quiz');

  const beginQuiz = useCallback(async () => {
    setGenerating(true);
    setGenError(null);
    recordedRef.current = false;
    try {
      const target = params.conversationId
        ? useQuizStore.getState().conversations.find((c) => c.id === params.conversationId)
        : undefined;
      if (params.conversationId && !target) {
        setGenError('Conversation not found.');
        return;
      }
      const generated = await generateQuiz({
        content: target?.content,
        topic: params.topic || undefined,
        url: params.url || undefined,
        difficulty: params.difficulty ?? 'medium',
        count: Number(params.count) || 5,
      });
      const questions = generated.questions;
      setSourceText(generated.sourceText);
      setExplanations({});
      setSavedToLibrary(false);
      if (questions.length === 0) {
        setGenError(
          target
            ? 'Not enough content to build a quiz. Add a few full sentences to this conversation.'
            : 'Could not generate questions from that source. Try different input.'
        );
        return;
      }
      startQuiz(target?.id ?? null, questions);
    } catch (error) {
      setGenError(error instanceof Error ? error.message : 'Quiz generation failed.');
    } finally {
      setGenerating(false);
    }
  }, [params.conversationId, params.topic, params.url, params.difficulty, params.count, startQuiz]);

  useEffect(() => {
    beginQuiz();
    return () => resetQuiz();
  }, [beginQuiz, resetQuiz]);

  // Record the result exactly once when the quiz finishes.
  useEffect(() => {
    if (quiz.status === 'finished' && !recordedRef.current) {
      recordedRef.current = true;
      const correct = quiz.answers.filter((a, i) => a === quiz.questions[i].correct).length;
      applyQuizResult(quiz.conversationId, correct, quiz.questions.length);
    }
  }, [quiz, applyQuizResult]);

  if (generating || genError || quiz.status === 'idle') {
    return (
      <View className="flex-1 justify-center bg-background px-6 dark:bg-dark-bg">
        {generating ? (
          <>
            <ActivityIndicator />
            <Text className="mt-4 text-center text-lg text-gray-500 dark:text-gray-400">
              {t('quiz.building', { title: sourceTitle })}
            </Text>
          </>
        ) : (
          <>
            <View className="mb-3 items-center">
              <Ionicons name="alert-circle-outline" size={40} color="#9CA3AF" />
            </View>
            <Text className="text-center text-lg text-gray-500 dark:text-gray-400">
              {genError}
            </Text>
            <Button title={t('common.goBack')} onPress={() => router.back()} className="mt-4" />
          </>
        )}
      </View>
    );
  }

  if (quiz.status === 'finished') {
    const total = quiz.questions.length;
    const correct = quiz.answers.filter((a, i) => a === quiz.questions[i].correct).length;
    const nextReview = conversation?.memory.nextReviewAt
      ? new Date(conversation.memory.nextReviewAt).toLocaleDateString()
      : null;
    return (
      <View className="flex-1 justify-center bg-background px-6 dark:bg-dark-bg">
        <Animated.View entering={FadeInDown.duration(400)} className="items-center">
          <Ionicons
            name={correct === total ? 'trophy' : correct / total >= 0.6 ? 'ribbon' : 'refresh-circle'}
            size={56}
            color={correct === total ? '#FFD166' : '#4B5EAA'}
          />
        </Animated.View>
        <Text className="mb-2 mt-2 text-center text-3xl font-bold text-primary dark:text-dark-text">
          {t('quiz.complete')}
        </Text>
        <Text className="mb-2 text-center text-lg text-black dark:text-dark-text">
          {t('quiz.result', { correct, total, xp: xpForQuiz(correct, total) })}
          {correct === total ? t('quiz.perfectBonus') : ''}
        </Text>
        {nextReview && (
          <Text className="mb-6 text-center text-gray-500 dark:text-gray-400">
            {t('quiz.nextReview', { date: nextReview })}
          </Text>
        )}
        {/* Ad-hoc quizzes (topic/URL) can be kept for spaced repetition. */}
        {!params.conversationId && (params.topic || params.url) && (
          <Button
            title={savedToLibrary ? t('quiz.savedToLibrary') : t('quiz.saveToLibrary')}
            icon={savedToLibrary ? 'checkmark-done-outline' : 'bookmark-outline'}
            variant="success"
            disabled={savedToLibrary}
            onPress={() => {
              const title = params.topic ?? (params.url ? new URL(params.url).hostname : 'Quiz');
              const content =
                sourceText ??
                quiz.questions
                  .map((q) => `Q: ${q.question}\nA: ${q.options[q.correct]}`)
                  .join('\n\n');
              addConversation({ title, content });
              setSavedToLibrary(true);
              Toast.show({ type: 'success', text1: t('quiz.savedToLibrary') });
            }}
            className="mb-3"
          />
        )}
        <Button title={t('common.tryAgain')} icon="refresh-outline" onPress={beginQuiz} className="mb-3" />
        <Button
          title={t('common.done')}
          icon="checkmark-outline"
          variant="secondary"
          onPress={() => router.back()}
        />
      </View>
    );
  }

  const question = quiz.questions[quiz.currentQuestion];
  const selected = quiz.answers[quiz.currentQuestion];
  const answered = selected != null;

  const optionStyle = (index: number) => {
    if (!answered) return 'bg-blue-500';
    if (index === question.correct) return 'bg-green-500';
    if (index === selected) return 'bg-red-500';
    return 'bg-gray-300';
  };

  return (
    <View className="flex-1 bg-background px-4 py-8 dark:bg-dark-bg sm:px-6">
      <Text className="mb-1 text-center text-sm text-gray-500 dark:text-gray-400" numberOfLines={1}>
        {sourceTitle}
      </Text>
      <Text className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
        {t('quiz.questionOf', { current: quiz.currentQuestion + 1, total: quiz.questions.length })}
      </Text>
      <Animated.View key={quiz.currentQuestion} entering={FadeInRight.duration(300)}>
        <Text className="mb-4 text-lg text-black dark:text-dark-text">{question.question}</Text>
        {question.options.map((option, index) => (
          <Pressable
            key={index}
            className={`mb-2 flex-row items-center justify-center rounded-lg p-3 ${optionStyle(index)} active:opacity-80`}
            onPress={() => {
              answerFeedback(index === question.correct);
              answerQuestion(index);
            }}
            disabled={answered}
            accessibilityRole="button"
            accessibilityLabel={`Answer: ${option}`}
          >
            {answered && index === question.correct && (
              <Ionicons name="checkmark-circle" size={18} color="#fff" style={{ marginRight: 6 }} />
            )}
            {answered && index === selected && index !== question.correct && (
              <Ionicons name="close-circle" size={18} color="#fff" style={{ marginRight: 6 }} />
            )}
            <Text className="text-center text-white">{option}</Text>
          </Pressable>
        ))}
      </Animated.View>
      {answered && (
        <Animated.View entering={FadeInDown.duration(250)}>
          <Text
            className={`mt-4 text-center ${
              selected === question.correct ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {selected === question.correct
              ? t('quiz.correct')
              : t('quiz.correctAnswer', { answer: question.options[question.correct] })}
          </Text>

          {/* AI explanation for wrong answers (when the function is configured). */}
          {selected !== question.correct && aiGenerationAvailable() && (
            <View className="mt-2">
              {explanations[quiz.currentQuestion] ? (
                <View className="rounded-lg border-l-4 border-l-primary bg-primary/5 p-3 dark:bg-primary/15">
                  <Text className="text-sm text-gray-700 dark:text-gray-300">
                    {explanations[quiz.currentQuestion]}
                  </Text>
                </View>
              ) : (
                <Pressable
                  className="flex-row items-center justify-center py-2"
                  disabled={explaining}
                  onPress={async () => {
                    setExplaining(true);
                    const explanation = await explainAnswer({
                      question: question.question,
                      options: question.options,
                      correct: question.correct,
                      selected,
                      context: conversation?.content ?? sourceText,
                    });
                    setExplaining(false);
                    if (explanation) {
                      setExplanations((prev) => ({ ...prev, [quiz.currentQuestion]: explanation }));
                    } else {
                      Toast.show({ type: 'error', text1: t('quiz.explainFailed') });
                    }
                  }}
                  accessibilityRole="button"
                >
                  {explaining ? (
                    <ActivityIndicator size="small" />
                  ) : (
                    <Ionicons name="bulb-outline" size={16} color="#4B5EAA" />
                  )}
                  <Text className="ml-1 text-sm font-semibold text-primary dark:text-accent">
                    {explaining ? t('quiz.explaining') : t('quiz.explain')}
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Confidence rating: feeds the SM-2 grade (optional, one tap). */}
          <Text className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
            {t('quiz.howSure')}
          </Text>
          <View className="mt-2 flex-row justify-center">
            {CONFIDENCE_OPTIONS.map(({ value, labelKey }) => {
              const selectedConfidence = quiz.confidences[quiz.currentQuestion] === value;
              return (
                <Pressable
                  key={value}
                  className={`mx-1 rounded-full border px-4 py-1.5 ${
                    selectedConfidence
                      ? 'border-primary bg-primary'
                      : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'
                  }`}
                  onPress={() => setConfidence(value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedConfidence }}
                >
                  <Text
                    className={
                      selectedConfidence
                        ? 'text-xs font-semibold text-white'
                        : 'text-xs text-black dark:text-dark-text'
                    }
                  >
                    {t(labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            className="mt-4 flex-row items-center justify-center rounded-lg bg-blue-500 p-3 active:opacity-80"
            onPress={nextQuestion}
            accessibilityRole="button"
          >
            <Text className="text-center font-semibold text-white">
              {quiz.currentQuestion < quiz.questions.length - 1 ? t('common.next') : t('common.finish')}
            </Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 6 }} />
          </Pressable>
        </Animated.View>
      )}
      <Text className="mt-4 text-center text-lg text-black dark:text-dark-text">
        {t('quiz.score', { score: quiz.score })}
      </Text>
    </View>
  );
}
