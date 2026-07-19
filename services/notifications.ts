import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface ReminderSettings {
  quizIntervalDays: number;
  quizTime: string; // HH:MM, 24h
}

const supported = Platform.OS !== 'web';

if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

async function ensurePermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Next occurrence of quizTime that is at least quizIntervalDays after the
 * last completed quiz (or now, for users who never completed one).
 */
export function computeNextReminderDate(
  settings: ReminderSettings,
  lastQuizCompletedAt: string | null,
  now: Date = new Date()
): Date {
  const [hour, minute] = settings.quizTime.split(':').map(Number);

  const earliest = lastQuizCompletedAt
    ? new Date(
        new Date(lastQuizCompletedAt).getTime() + settings.quizIntervalDays * 24 * 60 * 60 * 1000
      )
    : now;
  const base = earliest.getTime() < now.getTime() ? now : earliest;

  const fire = new Date(base);
  fire.setHours(hour, minute, 0, 0);
  while (fire.getTime() <= base.getTime()) {
    fire.setDate(fire.getDate() + 1);
  }
  return fire;
}

/**
 * Replaces any scheduled quiz reminder with the next one. Returns false when
 * notifications are unsupported (web) or permission was denied.
 */
export async function scheduleQuizReminder(
  settings: ReminderSettings,
  lastQuizCompletedAt: string | null,
  dueCount: number
): Promise<boolean> {
  if (!supported) return false;

  try {
    const granted = await ensurePermissions();
    if (!granted) return false;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('quiz-reminders', {
        name: 'Quiz reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to review',
        body:
          dueCount > 0
            ? `${dueCount} conversation${dueCount === 1 ? '' : 's'} waiting for a quiz.`
            : 'Keep your memory sharp — take a quick quiz.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: computeNextReminderDate(settings, lastQuizCompletedAt),
        channelId: Platform.OS === 'android' ? 'quiz-reminders' : undefined,
      },
    });
    return true;
  } catch (error) {
    console.warn('Failed to schedule quiz reminder', error);
    return false;
  }
}
