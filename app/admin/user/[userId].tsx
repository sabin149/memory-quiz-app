import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { Query } from 'react-native-appwrite';
import Button from '@/components/ui/Button';
import { DATABASE_ID, databases } from '@/lib/appwrite';
import type { AnalyticsEvent } from '@/services/analytics';

const PAGE_SIZE = 25;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

const PRESETS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: 'All', days: null },
] as const;

function toDayString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Per-user activity timeline: event names + timestamps only, never content. */
export default function AdminUserDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [preset, setPreset] = useState<number | null>(30);
  const [fromInput, setFromInput] = useState('');
  const [toInput, setToInput] = useState('');
  const [dateError, setDateError] = useState<string | null>(null);
  // Applied filter (only changes via presets or a valid custom submit).
  const [range, setRange] = useState<{ from: string | null; to: string | null }>({
    from: toDayString(new Date(Date.now() - 30 * DAY_MS)),
    to: null,
  });

  const applyPreset = (days: number | null) => {
    setPreset(days);
    setFromInput('');
    setToInput('');
    setDateError(null);
    setRange({ from: days ? toDayString(new Date(Date.now() - days * DAY_MS)) : null, to: null });
  };

  const applyCustom = () => {
    if (!DATE_PATTERN.test(fromInput) || !DATE_PATTERN.test(toInput)) {
      setDateError('Use YYYY-MM-DD for both dates.');
      return;
    }
    if (fromInput > toInput) {
      setDateError('"From" must be before "to".');
      return;
    }
    setDateError(null);
    setPreset(0); // custom marker
    setRange({ from: fromInput, to: toInput });
  };

  const {
    data,
    isPending,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['admin-user-events', userId, range.from, range.to],
    enabled: Boolean(userId),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const queries = [
        Query.equal('ownerId', userId!),
        Query.orderDesc('$createdAt'),
        Query.limit(PAGE_SIZE),
      ];
      if (range.from) queries.push(Query.greaterThanEqual('$createdAt', `${range.from}T00:00:00.000Z`));
      if (range.to) queries.push(Query.lessThanEqual('$createdAt', `${range.to}T23:59:59.999Z`));
      if (pageParam) queries.push(Query.cursorAfter(pageParam));
      const result = await databases.listDocuments<AnalyticsEvent>(DATABASE_ID, 'events', queries);
      return result.documents;
    },
    getNextPageParam: (lastPage) =>
      lastPage.length === PAGE_SIZE ? lastPage[lastPage.length - 1].$id : undefined,
  });

  const events = data?.pages.flat() ?? [];

  const copyId = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(userId ?? '');
      Toast.show({ type: 'success', text1: 'User id copied' });
    }
  };

  return (
    <View className="flex-1 bg-background px-4 py-4 dark:bg-dark-bg sm:px-6">
      {/* Pinned header: id stays visible and copyable while the list scrolls. */}
      <View className="mb-1 flex-row items-center">
        <Text
          selectable
          className="mr-2 flex-1 font-mono text-sm text-black dark:text-dark-text"
          numberOfLines={1}
        >
          {userId}
        </Text>
        <Pressable onPress={copyId} accessibilityRole="button" accessibilityLabel="Copy user id" hitSlop={8}>
          <Ionicons name="copy-outline" size={16} color="#9CA3AF" />
        </Pressable>
      </View>

      <View className="mb-2 flex-row items-center">
        {PRESETS.map(({ label, days }) => (
          <Pressable
            key={label}
            className={`mr-2 rounded-full border px-3 py-1.5 ${
              preset === days
                ? 'border-primary bg-primary'
                : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'
            }`}
            onPress={() => applyPreset(days)}
            accessibilityRole="button"
            accessibilityState={{ selected: preset === days }}
          >
            <Text
              className={
                preset === days
                  ? 'text-xs font-semibold text-white'
                  : 'text-xs text-black dark:text-dark-text'
              }
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="mb-1 flex-row items-center gap-2">
        <TextInput
          className="flex-1 rounded-lg border border-gray-300 bg-white p-2 text-xs text-black dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          placeholder="From YYYY-MM-DD"
          placeholderTextColor="#9CA3AF"
          value={fromInput}
          onChangeText={setFromInput}
          autoCapitalize="none"
          accessibilityLabel="Filter from date"
        />
        <TextInput
          className="flex-1 rounded-lg border border-gray-300 bg-white p-2 text-xs text-black dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          placeholder="To YYYY-MM-DD"
          placeholderTextColor="#9CA3AF"
          value={toInput}
          onChangeText={setToInput}
          autoCapitalize="none"
          accessibilityLabel="Filter to date"
        />
        <Pressable
          className="rounded-lg bg-primary px-3 py-2 active:opacity-80"
          onPress={applyCustom}
          accessibilityRole="button"
          accessibilityLabel="Apply date filter"
        >
          <Ionicons name="funnel-outline" size={16} color="#fff" />
        </Pressable>
      </View>
      <Text className="mb-2 text-xs text-red-500">{dateError ?? ' '}</Text>

      {isError ? (
        <View className="flex-1 justify-center">
          <Text className="mb-4 text-center text-gray-500 dark:text-gray-400">
            Could not load this user’s activity.
          </Text>
          <Button title="Retry" icon="refresh-outline" onPress={() => refetch()} />
        </View>
      ) : isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
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
              No events in this range.
            </Text>
          }
          ListFooterComponent={
            hasNextPage ? (
              <Button
                title={isFetchingNextPage ? 'Loading…' : `Load more (${events.length} shown)`}
                variant="ghost"
                onPress={() => fetchNextPage()}
                loading={isFetchingNextPage}
                className="mt-2"
              />
            ) : events.length > 0 ? (
              <Text className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
                {events.length} event{events.length === 1 ? '' : 's'} — end of range
              </Text>
            ) : null
          }
        />
      )}
    </View>
  );
}
