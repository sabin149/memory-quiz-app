import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BarChart from '@/components/charts/BarChart';
import LineChart from '@/components/charts/LineChart';
import AnimatedBar from '@/components/ui/AnimatedBar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { fetchAdminActivity } from '@/services/admin';
import { computeDashboardStats, computeEventBreakdown } from '@/utils/adminStats';

const WINDOW_DAYS = 30;
const CHART_DAYS = 14;

/** Shared with the users screen via the query cache. */
export function useAdminActivity() {
  return useQuery({
    queryKey: ['admin-activity', WINDOW_DAYS],
    queryFn: () => fetchAdminActivity(WINDOW_DAYS),
  });
}

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
  const { data, isPending, isError, refetch, isRefetching } = useAdminActivity();

  const stats = useMemo(
    () =>
      data ? computeDashboardStats(data.events, data.attempts, new Date(), CHART_DAYS) : null,
    [data]
  );
  const breakdown = useMemo(() => (data ? computeEventBreakdown(data.events) : []), [data]);

  if (isError) {
    return (
      <View className="flex-1 justify-center bg-background px-6 dark:bg-dark-bg">
        <Text className="mb-4 text-center text-gray-500 dark:text-gray-400">
          Could not load analytics. Ensure the database is provisioned
          (scripts/setup-appwrite.mjs) and your account is in the &quot;admins&quot; team.
        </Text>
        <Button title="Retry" icon="refresh-outline" onPress={() => refetch()} />
      </View>
    );
  }

  if (isPending || !stats) {
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
        <Button
          title={isRefetching ? 'Refreshing…' : 'Refresh'}
          icon="refresh-outline"
          variant="ghost"
          onPress={() => refetch()}
          className="mt-2"
        />
      </Animated.View>
    </ScrollView>
  );
}
