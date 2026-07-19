import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { trackEvent } from '@/services/analytics';
import {
  loginWithOAuth,
  OAuthProviderKey,
  toAuthErrorMessage,
  User,
} from '@/services/auth';

interface OAuthButtonsProps {
  onLoggedIn: (user: User) => void;
  disabled?: boolean;
}

/** Provider-conventional styling: Google white with border, GitHub dark. */
const PROVIDERS: {
  key: OAuthProviderKey;
  labelKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  container: string;
  label: string;
  iconColor: string;
  spinner: string;
}[] = [
  {
    key: 'google',
    labelKey: 'auth.continueWithGoogle',
    icon: 'logo-google',
    container: 'border border-gray-300 bg-white dark:border-gray-500',
    label: 'text-gray-800',
    iconColor: '#4285F4',
    spinner: '#4285F4',
  },
  {
    key: 'github',
    labelKey: 'auth.continueWithGithub',
    icon: 'logo-github',
    container: 'bg-[#24292F]',
    label: 'text-white',
    iconColor: '#fff',
    spinner: '#fff',
  },
];

export default function OAuthButtons({ onLoggedIn, disabled }: OAuthButtonsProps) {
  const { t } = useTranslation();
  const [busyProvider, setBusyProvider] = useState<OAuthProviderKey | null>(null);

  const handlePress = async (provider: OAuthProviderKey) => {
    setBusyProvider(provider);
    try {
      const user = await loginWithOAuth(provider);
      if (user) {
        trackEvent(user.$id, 'oauth_login');
        onLoggedIn(user);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('auth.signInFailed'),
        text2: toAuthErrorMessage(error),
      });
    } finally {
      setBusyProvider(null);
    }
  };

  return (
    <View>
      <View className="mb-4 flex-row items-center">
        <View className="h-px flex-1 bg-gray-300 dark:bg-gray-600" />
        <Text className="mx-3 text-gray-500 dark:text-gray-400">{t('auth.or')}</Text>
        <View className="h-px flex-1 bg-gray-300 dark:bg-gray-600" />
      </View>
      {PROVIDERS.map(({ key, labelKey, icon, container, label, iconColor, spinner }) => {
        const busy = busyProvider === key;
        return (
          <Pressable
            key={key}
            className={`mb-3 flex-row items-center justify-center rounded-lg p-3 active:opacity-80 ${container} ${busy || disabled ? 'opacity-60' : ''}`}
            onPress={() => handlePress(key)}
            disabled={disabled || busyProvider !== null}
            accessibilityRole="button"
            accessibilityLabel={t(labelKey)}
          >
            {busy ? (
              <ActivityIndicator size="small" color={spinner} />
            ) : (
              <>
                <Ionicons name={icon} size={20} color={iconColor} />
                <Text className={`ml-3 font-semibold ${label}`}>{t(labelKey)}</Text>
              </>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
