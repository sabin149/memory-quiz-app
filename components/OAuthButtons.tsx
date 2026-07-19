import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
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

const PROVIDERS: { key: OAuthProviderKey; label: string; className: string }[] = [
  { key: 'google', label: 'Continue with Google', className: 'bg-[#DB4437]' },
  { key: 'github', label: 'Continue with GitHub', className: 'bg-[#24292F]' },
];

export default function OAuthButtons({ onLoggedIn, disabled }: OAuthButtonsProps) {
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
      Toast.show({ type: 'error', text1: 'Sign-in failed', text2: toAuthErrorMessage(error) });
    } finally {
      setBusyProvider(null);
    }
  };

  return (
    <View>
      <View className="mb-4 flex-row items-center">
        <View className="h-px flex-1 bg-gray-300 dark:bg-gray-600" />
        <Text className="mx-3 text-gray-500 dark:text-gray-400">or</Text>
        <View className="h-px flex-1 bg-gray-300 dark:bg-gray-600" />
      </View>
      {PROVIDERS.map(({ key, label, className }) => {
        const busy = busyProvider === key;
        return (
          <Pressable
            key={key}
            className={`mb-3 rounded-lg p-3 ${className} ${busy ? 'opacity-60' : ''}`}
            onPress={() => handlePress(key)}
            disabled={disabled || busyProvider !== null}
          >
            <Text className="text-center font-semibold text-white">
              {busy ? 'Opening browser…' : label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
