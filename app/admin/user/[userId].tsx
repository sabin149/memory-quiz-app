import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { Query } from 'react-native-appwrite';
import { DATABASE_ID, databases } from '@/lib/appwrite';
import type { AnalyticsEvent } from '@/services/analytics';

const WINDOW_LIMIT = 100;

/** Per-user activity timeline: event names + timestamps only, never content. */
export default function AdminUserDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const {
    data: events,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin-user-events', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const result = await databases.listDocuments<AnalyticsEvent>(DATABASE_ID, 'events', [
        Query.equal('ownerId', userId!),
        Query.orderDesc('$createdAt'),
        Query.limit(WINDOW_LIMIT),
      ]);
      return result.documents;
    },
  });

  if (isError) {
    return (
      <View className="flex-1 justify-center bg-background px-6 dark:bg-dark-bg">
        <Text className="mb-4 text-center text-gray-500 dark:text-gray-400">
          Could not load this user’s activity.
        </Text>
        <Pressable className="rounded-lg bg-primary p-3" onPress={() => refetch()}>
          <Text className="text-center font-semibold text-white">Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!events) {
    return (
      <View className="flex-1 items-center justify-center bg-background dark:bg-dark-bg">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background px-4 py-6 dark:bg-dark-bg sm:px-6">
      <Text className="mb-1 font-mono text-sm text-black dark:text-dark-text" numberOfLines={1}>
        {userId}
      </Text>
      <Text className="mb-3 text-xs text-gray-500 dark:text-gray-400">
        Latest {events.length} events
      </Text>
      <FlatList
        data={events}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <View className="mb-1 flex-row items-center justify-between rounded-lg bg-white px-4 py-2 shadow-sm dark:bg-gray-800">
            <Text className="text-sm text-black dark:text-dark-text">{item.name}</Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(item.$createdAt).toLocaleString()}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text className="mt-8 text-center text-gray-500 dark:text-gray-400">
            No events for this user.
          </Text>
        }
      />
    </View>
  );
}
