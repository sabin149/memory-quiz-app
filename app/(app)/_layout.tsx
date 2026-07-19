import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { useEffect } from 'react';
import { checkIsAdmin } from '@/services/admin';
import { trackEvent } from '@/services/analytics';
import { scheduleQuizReminder } from '@/services/notifications';
import { useQuizStore } from '@/store';

export default function AppLayout() {
  const user = useQuizStore((s) => s.user);
  const syncConversations = useQuizStore((s) => s.syncConversations);

  useEffect(() => {
    if (!user) return;
    trackEvent(user.$id, 'app_opened');
    checkIsAdmin().then((isAdmin) => useQuizStore.getState().setIsAdmin(isAdmin));
    useQuizStore.getState().hydrateGamification(user.prefs?.gamification);
    (async () => {
      await syncConversations();
      const { settings, lastQuizCompletedAt, dueCount } = useQuizStore.getState();
      await scheduleQuizReminder(settings, lastQuizCompletedAt, dueCount());
    })();
  }, [user, syncConversations]);

  if (!user) {
    return <Redirect href="/login" />;
  }
  if (!user.emailVerification) {
    return <Redirect href="/verify-pending" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4B5EAA',
        tabBarInactiveTintColor: '#9CA3AF',
        headerStyle: { backgroundColor: '#4B5EAA' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        tabBarStyle: { paddingBottom: 4 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="library-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: 'Practice',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trending-up-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Screens reachable by navigation but hidden from the tab bar. */}
      <Tabs.Screen name="quiz" options={{ href: null, title: 'Quiz' }} />
      <Tabs.Screen name="edit" options={{ href: null, title: 'Add Conversation' }} />
      <Tabs.Screen name="settings" options={{ href: null, title: 'Preferences' }} />
      <Tabs.Screen name="conversation/[id]" options={{ href: null, title: 'Conversation' }} />
    </Tabs>
  );
}
