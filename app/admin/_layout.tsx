import { Redirect, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { checkIsAdmin } from '@/services/admin';
import { useQuizStore } from '@/store';

type Gate = 'checking' | 'allowed' | 'denied';

export default function AdminLayout() {
  const user = useQuizStore((s) => s.user);
  const isAdmin = useQuizStore((s) => s.isAdmin);
  const [gate, setGate] = useState<Gate>(isAdmin ? 'allowed' : 'checking');

  useEffect(() => {
    if (!user || isAdmin) return;
    let cancelled = false;
    // Verify against the server; the cached flag alone must not grant access.
    checkIsAdmin().then((allowed) => {
      if (!cancelled) setGate(allowed ? 'allowed' : 'denied');
    });
    return () => {
      cancelled = true;
    };
  }, [user, isAdmin]);

  if (!user) {
    return <Redirect href="/login" />;
  }
  if (gate === 'denied') {
    return <Redirect href="/home" />;
  }
  if (gate === 'checking') {
    return (
      <View className="flex-1 items-center justify-center bg-background dark:bg-dark-bg">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Admin — Dashboard' }} />
      <Stack.Screen name="users" options={{ title: 'Admin — Users' }} />
      <Stack.Screen name="user/[userId]" options={{ title: 'Admin — User activity' }} />
    </Stack>
  );
}
