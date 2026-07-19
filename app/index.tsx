import { Redirect } from 'expo-router';
import { useQuizStore } from '@/store';

export default function Index() {
  const user = useQuizStore((s) => s.user);
  const hasOnboarded = useQuizStore((s) => s.hasOnboarded);

  if (user) return <Redirect href="/home" />;
  return hasOnboarded ? <Redirect href="/login" /> : <Redirect href="/onboarding" />;
}
