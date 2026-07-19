import { Redirect, Stack } from 'expo-router';
import { useQuizStore } from '@/store';

export default function AuthLayout() {
  const user = useQuizStore((s) => s.user);

  if (user) {
    return <Redirect href="/home" />;
  }

  return (
    <Stack>
      <Stack.Screen name="login" options={{ title: 'Login', headerShown: false }} />
      <Stack.Screen name="register" options={{ title: 'Register', headerShown: false }} />
      <Stack.Screen
        name="forgot-password"
        options={{ title: 'Reset Password', headerShown: false }}
      />
    </Stack>
  );
}
