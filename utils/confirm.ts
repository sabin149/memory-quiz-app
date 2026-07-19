import { Alert, Platform } from 'react-native';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
}

/**
 * Cross-platform confirmation. React Native Web's Alert.alert is a silent
 * no-op, so confirmations that "do nothing" on web must go through here.
 */
export function confirmAction({
  title,
  message,
  confirmLabel = 'Confirm',
  destructive = false,
}: ConfirmOptions): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      {
        text: confirmLabel,
        style: destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ]);
  });
}
