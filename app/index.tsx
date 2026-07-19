import { Redirect } from 'expo-router';
import { useQuizStore } from '@/store';

export default function Index() {
  const user = useQuizStore((s) => s.user);
  return user ? <Redirect href="/home" /> : <Redirect href="/login" />;
}
