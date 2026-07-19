import { Redirect, Stack } from 'expo-router';
import { useEffect } from 'react';
import { scheduleQuizReminder } from '@/services/notifications';
import { useQuizStore } from '@/store';

export default function AppLayout() {
  const user = useQuizStore((s) => s.user);
  const syncConversations = useQuizStore((s) => s.syncConversations);

  useEffect(() => {
    if (!user) return;
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
    </Stack>
  );
}
