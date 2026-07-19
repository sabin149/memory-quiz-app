import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { confirmAction } from '@/utils/confirm';
import StrengthBar from '@/components/StrengthBar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Difficulty, QUESTION_COUNTS } from '@/services/quiz';
import { useQuizStore } from '@/store';
import { memoryStrength } from '@/utils/memoryStrength';
import { isDue } from '@/utils/sm2';

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

export default function ConversationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { conversations, tagConversation, removeConversation } = useQuizStore();
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [count, setCount] = useState<number>(5);

  const conversation = conversations.find((c) => c.id === id);

  if (!conversation) {
    return (
      <View className="flex-1 justify-center bg-background px-6 dark:bg-dark-bg">
        <Text className="mb-4 text-center text-gray-500 dark:text-gray-400">
          Conversation not found.
        </Text>
        <Button title="Back to library" onPress={() => router.back()} />
      </View>
    );
  }

  const strength = memoryStrength(conversation.memory);
  const due = isDue(conversation.memory);

  const confirmDelete = async () => {
    const confirmed = await confirmAction({
      title: 'Delete conversation',
      message: `Delete "${conversation.title}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (confirmed) {
      removeConversation(conversation.id);
      router.back();
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-dark-bg"
      contentContainerClassName="px-4 py-4 sm:px-6"
    >
      <View className="mb-1 flex-row items-start justify-between">
        <Text className="mr-3 flex-1 text-2xl font-bold text-black dark:text-dark-text">
          {conversation.title}
        </Text>
        <View className="flex-row gap-2">
          <Pressable
            className={`h-9 w-9 items-center justify-center rounded-lg ${conversation.tagged ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            onPress={() => tagConversation(conversation.id)}
            accessibilityRole="button"
            accessibilityLabel={conversation.tagged ? 'Remove tag' : 'Tag as important'}
          >
            <Ionicons
              name={conversation.tagged ? 'pricetag' : 'pricetag-outline'}
              size={17}
              color="#fff"
            />
          </Pressable>
          <Pressable
            className="h-9 w-9 items-center justify-center rounded-lg bg-red-400"
            onPress={confirmDelete}
            accessibilityRole="button"
            accessibilityLabel="Delete conversation"
          >
            <Ionicons name="trash-outline" size={17} color="#fff" />
          </Pressable>
        </View>
      </View>
      <Text className="mb-4 text-xs text-gray-500 dark:text-gray-400">
        Saved {new Date(conversation.createdAt).toLocaleDateString()} ·{' '}
        {conversation.content.split(/\s+/).length} words
        {conversation.synced ? '' : ' · not synced yet'}
      </Text>

      <Card className="mb-4">
        <View className="mb-1 flex-row items-center justify-between">
          <Text className="font-semibold text-black dark:text-dark-text">Memory strength</Text>
          {due && (
            <View className="rounded-full bg-orange-100 px-2 py-0.5 dark:bg-orange-500/20">
              <Text className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                Due for review
              </Text>
            </View>
          )}
        </View>
        <StrengthBar memory={conversation.memory} />
        <Text className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {conversation.memory.lastReviewedAt
            ? `Last quiz ${new Date(conversation.memory.lastReviewedAt).toLocaleDateString()} (${conversation.memory.lastScorePct}%)` +
              (conversation.memory.nextReviewAt
                ? ` · next review ${new Date(conversation.memory.nextReviewAt).toLocaleDateString()}`
                : '')
            : `Never quizzed — currently at ${strength}%. Take the first quiz to start the schedule.`}
        </Text>
      </Card>

      <Card className="mb-4">
        <Text className="mb-3 font-semibold text-black dark:text-dark-text">Quiz me</Text>
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
          title="Start quiz"
          icon="school-outline"
          onPress={() =>
            router.push({
              pathname: '/quiz',
              params: { conversationId: conversation.id, difficulty, count: String(count) },
            })
          }
        />
      </Card>

      <Card className="mb-8">
        <Text className="mb-2 font-semibold text-black dark:text-dark-text">Content</Text>
        <Text className="text-gray-700 dark:text-gray-300">{conversation.content}</Text>
      </Card>
    </ScrollView>
  );
}
