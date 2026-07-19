import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { aiGenerationAvailable, Difficulty, QUESTION_COUNTS } from '@/services/quiz';

type Source = 'topic' | 'url';

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={`mr-2 rounded-full border px-4 py-2 ${
        selected
          ? 'border-primary bg-primary'
          : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'
      }`}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text className={selected ? 'font-semibold text-white' : 'text-black dark:text-dark-text'}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Generate an on-demand AI quiz from a topic or a public web page. */
export default function PracticeScreen() {
  const router = useRouter();
  const [source, setSource] = useState<Source>('topic');
  const [topic, setTopic] = useState('');
  const [url, setUrl] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [count, setCount] = useState<number>(5);
  const [error, setError] = useState<string | null>(null);

  const aiReady = aiGenerationAvailable();

  const handleGenerate = () => {
    if (source === 'topic') {
      if (topic.trim().length < 3) {
        setError('Enter a topic with at least 3 characters.');
        return;
      }
    } else {
      if (!/^https?:\/\/\S+\.\S+/.test(url.trim())) {
        setError('Enter a valid public URL starting with http(s)://');
        return;
      }
    }
    setError(null);
    router.push({
      pathname: '/quiz',
      params: {
        ...(source === 'topic' ? { topic: topic.trim() } : { url: url.trim() }),
        difficulty,
        count: String(count),
      },
    });
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background dark:bg-dark-bg"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerClassName="px-4 py-4 sm:px-6" keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.duration(300)}>
          <Text className="mb-1 text-2xl font-bold text-black dark:text-dark-text">
            Practice anything
          </Text>
          <Text className="mb-4 text-gray-500 dark:text-gray-400">
            Generate an AI quiz from a topic or a public web page — no saving required.
          </Text>

          {!aiReady && (
            <Card className="mb-4 border-l-4 border-l-yellow-500">
              <View className="flex-row items-center">
                <Ionicons name="construct-outline" size={18} color="#EAB308" />
                <Text className="ml-2 flex-1 text-sm text-gray-600 dark:text-gray-300">
                  AI generation isn&apos;t configured yet. Deploy the generate-quiz function and set
                  EXPO_PUBLIC_APPWRITE_QUIZ_FUNCTION_ID. Quizzes on saved conversations still work.
                </Text>
              </View>
            </Card>
          )}

          <Card className="mb-4">
            <View className="mb-4 flex-row overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600">
              {(
                [
                  { value: 'topic', label: 'Topic', icon: 'bulb-outline' },
                  { value: 'url', label: 'Web page', icon: 'link-outline' },
                ] as const
              ).map(({ value, label, icon }) => (
                <Pressable
                  key={value}
                  className={`flex-1 flex-row items-center justify-center p-3 ${source === value ? 'bg-primary' : 'bg-white dark:bg-gray-800'}`}
                  onPress={() => setSource(value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: source === value }}
                >
                  <Ionicons
                    name={icon}
                    size={16}
                    color={source === value ? '#fff' : '#9CA3AF'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    className={
                      source === value ? 'font-semibold text-white' : 'text-black dark:text-dark-text'
                    }
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {source === 'topic' ? (
              <TextField
                label="What do you want to be quizzed on?"
                placeholder="e.g. React Native navigation, the Krebs cycle…"
                value={topic}
                onChangeText={setTopic}
                error={error ?? undefined}
              />
            ) : (
              <TextField
                label="Public page URL"
                placeholder="https://example.com/article"
                value={url}
                onChangeText={setUrl}
                error={error ?? undefined}
                autoCapitalize="none"
                keyboardType="url"
              />
            )}

            <Text className="mb-2 text-xs text-gray-500 dark:text-gray-400">Difficulty</Text>
            <View className="mb-3 flex-row">
              {DIFFICULTIES.map((d) => (
                <Chip
                  key={d.value}
                  label={d.label}
                  selected={difficulty === d.value}
                  onPress={() => setDifficulty(d.value)}
                />
              ))}
            </View>
            <Text className="mb-2 text-xs text-gray-500 dark:text-gray-400">Questions</Text>
            <View className="mb-4 flex-row">
              {QUESTION_COUNTS.map((n) => (
                <Chip key={n} label={String(n)} selected={count === n} onPress={() => setCount(n)} />
              ))}
            </View>
            <Button
              title="Generate quiz"
              icon="sparkles-outline"
              onPress={handleGenerate}
              disabled={!aiReady}
            />
          </Card>

          <Text className="text-xs text-gray-500 dark:text-gray-400">
            Ad-hoc quizzes earn XP and count toward your streak, but don&apos;t create a review
            schedule — save content to your library for spaced repetition.
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
