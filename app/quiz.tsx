import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useQuizStore } from '../store';

export default function QuizScreen() {
  const { conversationId } = useLocalSearchParams();
  const { quiz, answerQuestion, nextQuestion, user } = useQuizStore();
  const [showAnswer, setShowAnswer] = useState(false);
  const router = useRouter();

  if (!user) {
    router.replace('/login');
    return null;
  }

  const handleAnswer = (selected: number) => {
    answerQuestion(selected);
    setShowAnswer(true);
  };

  const handleNext = () => {
    setShowAnswer(false);
    if (quiz.currentQuestion < quiz.questions.length - 1) {
      nextQuestion();
    } else {
      alert(`Quiz finished! Score: ${quiz.score}`);
    }
  };

  return (
    <View className="flex-1 px-4 sm:px-6 py-10 bg-background dark:bg-dark-bg">
      <Text className="text-3xl font-bold text-center mb-6 text-primary dark:text-dark-text">Quiz: Conversation {conversationId}</Text>
      <Text className="text-lg mb-4 text-black dark:text-dark-text">{quiz.questions[quiz.currentQuestion].question}</Text>
      {quiz.questions[quiz.currentQuestion].options.map((option, index) => (
        <Pressable
          key={index}
          className={`rounded-lg p-3 mb-2 ${showAnswer ? (index === quiz.questions[quiz.currentQuestion].correct ? 'bg-green-500' : 'bg-gray-300') : 'bg-blue-500'}`}
          onPress={() => handleAnswer(index)}
          disabled={showAnswer}
        >
          <Text className="text-white text-center">{option}</Text>
        </Pressable>
      ))}
      {showAnswer && (
        <Text className="text-green-600 mt-4 text-center">
          Correct: {quiz.questions[quiz.currentQuestion].options[quiz.questions[quiz.currentQuestion].correct]}
        </Text>
      )}
      {showAnswer && (
        <Pressable
          className="bg-blue-500 rounded-lg p-3 mt-4"
          onPress={handleNext}
        >
          <Text className="text-white text-center font-semibold">Next</Text>
        </Pressable>
      )}
      <Text className="text-lg mt-4 text-center text-black dark:text-dark-text">Score: {quiz.score}</Text>
    </View>
  );
}