import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { generateQuiz } from '@/services/quiz';
import { useQuizStore } from '@/store';
import { xpForQuiz } from '@/utils/gamification';

function answerFeedback(correct: boolean) {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(
    correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
  ).catch(() => {});
}

export default function QuizScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { quiz, conversations, startQuiz, answerQuestion, nextQuestion, resetQuiz, applyQuizResult } =
    useQuizStore();
  const router = useRouter();
  const [generating, setGenerating] = useState(true);
  const [noContent, setNoContent] = useState(false);
  const recordedRef = useRef(false);

  const conversation = conversations.find((c) => c.id === conversationId);

  const beginQuiz = useCallback(async () => {
    const target = useQuizStore
      .getState()
      .conversations.find((c) => c.id === conversationId);
    if (!target) {
      setGenerating(false);
      return;
    }
    setGenerating(true);
    setNoContent(false);
    recordedRef.current = false;
    const questions = await generateQuiz(target);
    if (questions.length === 0) {
      setNoContent(true);
    } else {
      startQuiz(target.id, questions);
    }
    setGenerating(false);
  }, [conversationId, startQuiz]);

  useEffect(() => {
    beginQuiz();
    return () => resetQuiz();
  }, [beginQuiz, resetQuiz]);

  // Record the result exactly once when the quiz finishes.
  useEffect(() => {
    if (quiz.status === 'finished' && quiz.conversationId && !recordedRef.current) {
      recordedRef.current = true;
      const correct = quiz.answers.filter((a, i) => a === quiz.questions[i].correct).length;
      applyQuizResult(quiz.conversationId, correct, quiz.questions.length);
    }
  }, [quiz, applyQuizResult]);

  if (!conversation || noContent || generating || quiz.status === 'idle') {
    return (
      <View className="flex-1 justify-center bg-background px-6 dark:bg-dark-bg">
        {generating && conversation ? (
          <>
            <ActivityIndicator />
            <Text className="mt-4 text-center text-lg text-gray-500 dark:text-gray-400">
              Building your quiz from “{conversation.title}”…
            </Text>
          </>
        ) : (
          <>
            <Text className="text-center text-lg text-gray-500 dark:text-gray-400">
              {conversation
                ? 'Not enough content to build a quiz. Add a few full sentences to this conversation.'
                : 'Conversation not found.'}
            </Text>
            <Pressable className="mt-4 rounded-lg bg-primary p-3" onPress={() => router.back()}>
              <Text className="text-center font-semibold text-white">Go back</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  }

  if (quiz.status === 'finished') {
    const total = quiz.questions.length;
    const correct = quiz.answers.filter((a, i) => a === quiz.questions[i].correct).length;
    const nextReview = conversation.memory.nextReviewAt
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
          Quiz complete
        </Text>
        <Text className="mb-2 text-center text-lg text-black dark:text-dark-text">
          You got {correct} of {total} right — +{xpForQuiz(correct, total)} XP
          {correct === total ? ' (perfect bonus!)' : ''}
        </Text>
        {nextReview && (
          <Text className="mb-6 text-center text-gray-500 dark:text-gray-400">
            Next review scheduled for {nextReview}
          </Text>
        )}
        <Pressable className="mb-3 rounded-lg bg-primary p-3" onPress={beginQuiz}>
          <Text className="text-center font-semibold text-white">Try again</Text>
        </Pressable>
        <Pressable className="rounded-lg bg-secondary p-3" onPress={() => router.back()}>
          <Text className="text-center font-semibold text-white">Back to conversations</Text>
        </Pressable>
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
      <Text className="mb-1 text-center text-sm text-gray-500 dark:text-gray-400">
        {conversation.title}
      </Text>
      <Text className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Question {quiz.currentQuestion + 1} of {quiz.questions.length}
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
              ? 'Correct!'
              : `Correct answer: ${question.options[question.correct]}`}
          </Text>
          <Pressable
            className="mt-4 flex-row items-center justify-center rounded-lg bg-blue-500 p-3 active:opacity-80"
            onPress={nextQuestion}
          >
            <Text className="text-center font-semibold text-white">
              {quiz.currentQuestion < quiz.questions.length - 1 ? 'Next' : 'Finish'}
            </Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 6 }} />
          </Pressable>
        </Animated.View>
      )}
      <Text className="mt-4 text-center text-lg text-black dark:text-dark-text">
        Score: {quiz.score}
      </Text>
    </View>
  );
}
