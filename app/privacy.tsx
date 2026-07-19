import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text } from 'react-native';
import Button from '@/components/ui/Button';

const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: 'What we store',
    body: 'Your account (name, email), the conversations you save, your quiz results, and your app settings. Conversations are stored with per-user permissions: no other user — including admins — can read your content.',
  },
  {
    heading: 'Analytics',
    body: 'We record privacy-safe usage events only: an event name (e.g. "quiz_completed"), your user id, and a timestamp. The content of your conversations, your email, and your device details are never part of analytics.',
  },
  {
    heading: 'Quiz generation',
    body: 'By default, quiz questions are generated on your device. If server-side generation is enabled, your conversation text is sent to the configured AI provider solely to create questions and is not stored by this app beyond that request.',
  },
  {
    heading: 'Leaderboard (optional)',
    body: 'The global leaderboard is strictly opt-in. If you join, only your first name and progress numbers (XP, streak, level, quiz count) are visible to other users — never your content, email, or activity details. Leaving removes your entry immediately.',
  },
  {
    heading: 'Crash reporting',
    body: 'If enabled, crash reports contain technical error details only. Personally identifying information is stripped before sending.',
  },
  {
    heading: 'Your controls',
    body: 'You can delete any conversation at any time, and delete your account from Settings. Account deletion deactivates the account and removes access; you can also request full data removal.',
  },
];

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-dark-bg"
      contentContainerClassName="px-6 py-10"
    >
      <Text className="mb-6 text-3xl font-bold text-primary dark:text-dark-text">
        Privacy policy
      </Text>
      {SECTIONS.map(({ heading, body }) => (
        <React.Fragment key={heading}>
          <Text className="mb-1 mt-4 font-semibold text-black dark:text-dark-text">{heading}</Text>
          <Text className="text-gray-600 dark:text-gray-300">{body}</Text>
        </React.Fragment>
      ))}
      <Button title="Back" onPress={() => router.back()} className="mt-8" />
    </ScrollView>
  );
}
