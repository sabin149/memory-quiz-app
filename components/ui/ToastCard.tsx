import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import type { ToastConfig } from 'react-native-toast-message';

type Kind = 'success' | 'error' | 'info';

const KIND_STYLE: Record<Kind, { icon: keyof typeof Ionicons.glyphMap; accent: string; color: string }> = {
  success: { icon: 'checkmark-circle', accent: 'border-l-green-500', color: '#22C55E' },
  error: { icon: 'alert-circle', accent: 'border-l-red-500', color: '#EF4444' },
  info: { icon: 'information-circle', accent: 'border-l-primary', color: '#4B5EAA' },
};

function ToastCard({ kind, text1, text2 }: { kind: Kind; text1?: string; text2?: string }) {
  const { icon, accent, color } = KIND_STYLE[kind];
  return (
    <View
      className={`mx-4 w-[92%] max-w-xl flex-row items-center rounded-xl border-l-4 bg-white px-4 py-3 shadow-lg dark:bg-gray-800 ${accent}`}
      accessibilityRole="alert"
    >
      <Ionicons name={icon} size={24} color={color} />
      <View className="ml-3 flex-1">
        {text1 ? (
          <Text className="font-semibold text-black dark:text-dark-text">{text1}</Text>
        ) : null}
        {text2 ? (
          <Text className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">{text2}</Text>
        ) : null}
      </View>
    </View>
  );
}

/** Native-feeling toast styling shared by the whole app. */
export const toastConfig: ToastConfig = {
  success: ({ text1, text2 }) => <ToastCard kind="success" text1={text1} text2={text2} />,
  error: ({ text1, text2 }) => <ToastCard kind="error" text1={text1} text2={text2} />,
  info: ({ text1, text2 }) => <ToastCard kind="info" text1={text1} text2={text2} />,
};
