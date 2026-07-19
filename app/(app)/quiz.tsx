import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useQuizStore } from '@/store';

export default function QuizScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { quiz, conversations, startQuiz, answerQuestion, nextQuestion, resetQuiz } =
    useQuizStore();
  const router = useRouter();

  const conversation = conversations.find((c) => c.id === conversationId);

  useEffect(() => {
    if (conversationId) {
      startQuiz(conversationId);
    }
    return () => resetQuiz();
  }, [conversationId, startQuiz, resetQuiz]);

  if (!conversation || quiz.status === 'idle' || quiz.questions.length === 0) {
    return (
      <View className="flex-1 justify-center bg-background px-6 dark:bg-dark-bg">
        <Text className="text-center text-lg text-gray-500 dark:text-gray-400">
          {conversation ? 'Preparing quiz…' : 'Conversation not found.'}
        </Text>
        {!conversation && (
          <Pressable className="mt-4 rounded-lg bg-primary p-3" onPress={() => router.back()}>
            <Text className="text-center font-semibold text-white">Go back</Text>
          </Pressable>
        )}
      </View>
    );
  }

  if (quiz.status === 'finished') {
    const total = quiz.questions.length;
    const correct = quiz.answers.filter(
      (a, i) => a === quiz.questions[i].correct
    ).length;
    return (
      <View className="flex-1 justify-center bg-background px-6 dark:bg-dark-bg">
        <Text className="mb-2 text-center text-3xl font-bold text-primary dark:text-dark-text">
          Quiz complete
        </Text>
        <Text className="mb-6 text-center text-lg text-black dark:text-dark-text">
          You got {correct} of {total} right — {quiz.score} points
        </Text>
        <Pressable
          className="mb-3 rounded-lg bg-primary p-3"
          onPress={() => startQuiz(conversation.id)}
        >
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
      <Text className="mb-4 text-lg text-black dark:text-dark-text">{question.question}</Text>
      {question.options.map((option, index) => (
        <Pressable
          key={index}
          className={`mb-2 rounded-lg p-3 ${optionStyle(index)}`}
          onPress={() => answerQuestion(index)}
          disabled={answered}
        >
          <Text className="text-center text-white">{option}</Text>
        </Pressable>
      ))}
      {answered && (
        <>
          <Text
            className={`mt-4 text-center ${
              selected === question.correct ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {selected === question.correct
              ? 'Correct!'
              : `Correct answer: ${question.options[question.correct]}`}
          </Text>
          <Pressable className="mt-4 rounded-lg bg-blue-500 p-3" onPress={nextQuestion}>
            <Text className="text-center font-semibold text-white">
              {quiz.currentQuestion < quiz.questions.length - 1 ? 'Next' : 'Finish'}
            </Text>
          </Pressable>
        </>
      )}
      <Text className="mt-4 text-center text-lg text-black dark:text-dark-text">
        Score: {quiz.score}
      </Text>
    </View>
  );
}
