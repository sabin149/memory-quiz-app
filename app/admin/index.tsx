import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BarChart from '@/components/charts/BarChart';
import LineChart from '@/components/charts/LineChart';
import AnimatedBar from '@/components/ui/AnimatedBar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { fetchAttemptsSince } from '@/services/admin';
import { fetchEventsSince } from '@/services/analytics';
import {
  computeDashboardStats,
  computeEventBreakdown,
  DashboardStats,
} from '@/utils/adminStats';

const WINDOW_DAYS = 30;
const CHART_DAYS = 14;

function StatCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <Card className="mb-3 mr-3 min-w-[150px] flex-1">
      <View className="flex-row items-center">
        <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Ionicons name={icon} size={20} color="#4B5EAA" />
        </View>
        <View>
          <Text className="text-2xl font-bold text-primary dark:text-dark-text">{value}</Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">{label}</Text>
        </View>
      </View>
    </Card>
  );
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [breakdown, setBreakdown] = useState<{ name: string; count: number }[]>([]);
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
      const eventRecords = events.map((e) => ({
        name: e.name,
        ownerId: e.ownerId,
        createdAt: e.$createdAt,
      }));
      const attemptRecords = attempts.map((a) => ({
        ownerId: a.ownerId,
        scorePct: a.scorePct,
        completedAt: a.completedAt,
      }));
      setStats(computeDashboardStats(eventRecords, attemptRecords, new Date(), CHART_DAYS));
      setBreakdown(computeEventBreakdown(eventRecords));
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
        <Button title="Retry" icon="refresh-outline" onPress={load} />
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

  const maxBreakdown = Math.max(1, ...breakdown.map((b) => b.count));

  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-dark-bg"
      contentContainerClassName="px-4 py-6 sm:px-6"
    >
      <Animated.View entering={FadeInDown.duration(300)}>
        <View className="mb-1 flex-row items-center">
          <Ionicons name="shield-checkmark-outline" size={16} color="#9CA3AF" />
          <Text className="ml-1 text-xs text-gray-500 dark:text-gray-400">
            Privacy-safe analytics: event names, timestamps, and scores only — user content is
            never collected.
          </Text>
        </View>

        <View className="mt-3 flex-row flex-wrap">
          <StatCard icon="people-outline" label="Active today (DAU)" value={String(stats.dau)} />
          <StatCard icon="pulse-outline" label="Active this week (WAU)" value={String(stats.wau)} />
          <StatCard icon="person-add-outline" label="Signups (7d)" value={String(stats.signups7d)} />
        </View>
        <View className="flex-row flex-wrap">
          <StatCard icon="school-outline" label="Quizzes (7d)" value={String(stats.quizzes7d)} />
          <StatCard
            icon="checkmark-done-outline"
            label="Avg accuracy (7d)"
            value={stats.avgAccuracy7d != null ? `${stats.avgAccuracy7d}%` : '—'}
          />
          <StatCard
            icon="document-text-outline"
            label="Conversations (7d)"
            value={String(stats.conversationsCreated7d)}
          />
        </View>

        <Card className="mb-4 mt-1">
          <Text className="mb-3 font-semibold text-black dark:text-dark-text">
            Activity — last {CHART_DAYS} days
          </Text>
          <LineChart
            labels={stats.activityByDay.map((d) => d.day.slice(5))}
            series={[
              {
                name: 'Events',
                color: '#4B5EAA',
                values: stats.activityByDay.map((d) => d.events),
              },
              {
                name: 'Quizzes',
                color: '#FF6F61',
                values: stats.activityByDay.map((d) => d.quizzes),
              },
            ]}
          />
        </Card>

        <Card className="mb-4">
          <Text className="mb-3 font-semibold text-black dark:text-dark-text">
            Quiz accuracy per day
          </Text>
          <BarChart
            values={stats.activityByDay.map((d) => d.accuracyPct)}
            labels={stats.activityByDay.map((d) => d.day.slice(5))}
          />
        </Card>

        <Card className="mb-4">
          <Text className="mb-3 font-semibold text-black dark:text-dark-text">
            Event breakdown ({WINDOW_DAYS}d)
          </Text>
          {breakdown.length === 0 ? (
            <Text className="text-gray-500 dark:text-gray-400">No events yet.</Text>
          ) : (
            breakdown.map(({ name, count }) => (
              <View key={name} className="mb-2 flex-row items-center">
                <Text className="w-44 text-xs text-gray-600 dark:text-gray-300">{name}</Text>
                <AnimatedBar pct={(count / maxBreakdown) * 100} colorClass="bg-primary" />
                <Text className="ml-2 w-10 text-right text-xs text-gray-500 dark:text-gray-400">
                  {count}
                </Text>
              </View>
            ))
          )}
        </Card>

        <Button
          title="Per-user activity"
          icon="people-circle-outline"
          onPress={() => router.push('/admin/users')}
        />
        <Button title="Refresh" icon="refresh-outline" variant="ghost" onPress={load} className="mt-2" />
      </Animated.View>
    </ScrollView>
  );
}
