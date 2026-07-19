import { Redirect, Stack } from 'expo-router';
import { useQuizStore } from '@/store';

export default function AppLayout() {
  const user = useQuizStore((s) => s.user);

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
