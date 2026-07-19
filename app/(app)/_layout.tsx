import { Redirect, Stack } from 'expo-router';
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

  return (
    <Stack>
      <Stack.Screen name="home" options={{ title: 'Conversations', headerBackVisible: false }} />
      <Stack.Screen name="quiz" options={{ title: 'Quiz' }} />
      <Stack.Screen name="edit" options={{ title: 'Review & Save' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="stats" options={{ title: 'Your Progress' }} />
    </Stack>
  );
}
