import { useQuizStore } from '@/store';
import { Redirect } from 'expo-router';

export default function Index() {
  const { user } = useQuizStore();
  
  // Simple redirect without useEffect
  return user ? <Redirect href="/home" /> : <Redirect href="/login" />;
}