import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { fetchAttemptsSince } from '@/services/admin';
import { fetchEventsSince } from '@/services/analytics';
import { computeDashboardStats, DashboardStats } from '@/utils/adminStats';

const WINDOW_DAYS = 30;

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-3 mr-3 min-w-[140px] flex-1 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
      <Text className="text-2xl font-bold text-primary dark:text-dark-text">{value}</Text>
      <Text className="text-xs text-gray-500 dark:text-gray-400">{label}</Text>
    </View>
  );
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setStats(null);
    try {
      const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
      const [events, attempts] = await Promise.all([
        fetchEventsSince(since),
        fetchAttemptsSince(since),
      ]);
      setStats(
        computeDashboardStats(
          events.map((e) => ({ name: e.name, ownerId: e.ownerId, createdAt: e.$createdAt })),
          attempts.map((a) => ({
            ownerId: a.ownerId,
            scorePct: a.scorePct,
            completedAt: a.completedAt,
          }))
        )
      );
    } catch {
      setError(
        'Could not load analytics. Ensure the database is provisioned (scripts/setup-appwrite.mjs) and your account is in the "admins" team.'
      );
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <View className="flex-1 justify-center bg-background px-6 dark:bg-dark-bg">
        <Text className="mb-4 text-center text-gray-500 dark:text-gray-400">{error}</Text>
        <Pressable className="rounded-lg bg-primary p-3" onPress={load}>
          <Text className="text-center font-semibold text-white">Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!stats) {
    return (
      <View className="flex-1 items-center justify-center bg-background dark:bg-dark-bg">
        <ActivityIndicator />
      </View>
    );
  }

  const maxDayEvents = Math.max(1, ...stats.activityByDay.map((d) => d.events));

  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-dark-bg"
      contentContainerClassName="px-4 py-6 sm:px-6"
    >
      <Text className="mb-4 text-xs text-gray-500 dark:text-gray-400">
        Privacy-safe analytics: event names, timestamps, and scores only — user content is never
        collected.
      </Text>

      <View className="mb-4 flex-row flex-wrap">
        <StatCard label="Active today (DAU)" value={String(stats.dau)} />
        <StatCard label="Active this week (WAU)" value={String(stats.wau)} />
        <StatCard label="Signups (7d)" value={String(stats.signups7d)} />
      </View>
      <View className="mb-6 flex-row flex-wrap">
        <StatCard label="Quizzes taken (7d)" value={String(stats.quizzes7d)} />
        <StatCard
          label="Avg accuracy (7d)"
          value={stats.avgAccuracy7d != null ? `${stats.avgAccuracy7d}%` : '—'}
        />
        <StatCard label="Conversations added (7d)" value={String(stats.conversationsCreated7d)} />
      </View>

      <Text className="mb-2 font-semibold text-black dark:text-dark-text">
        Activity — last 7 days
      </Text>
      {stats.activityByDay.map(({ day, events, quizzes }) => (
        <View key={day} className="mb-2 flex-row items-center">
          <Text className="w-24 text-xs text-gray-500 dark:text-gray-400">{day.slice(5)}</Text>
          <View className="h-4 flex-1 flex-row overflow-hidden rounded bg-gray-200 dark:bg-gray-700">
            <View
              className="h-4 bg-primary"
              style={{ width: `${(events / maxDayEvents) * 100}%` }}
            />
          </View>
          <Text className="ml-2 w-24 text-xs text-gray-500 dark:text-gray-400">
            {events} ev / {quizzes} qz
          </Text>
        </View>
      ))}

      <Pressable
        className="mt-6 rounded-lg bg-primary p-3"
        onPress={() => router.push('/admin/users')}
      >
        <Text className="text-center font-semibold text-white">Per-user activity</Text>
      </Pressable>
      <Pressable className="mt-3" onPress={load}>
        <Text className="text-center text-secondary dark:text-accent">Refresh</Text>
      </Pressable>
    </ScrollView>
  );
}
