import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, Text, TextInput, TextInputProps, View } from 'react-native';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
}

const INPUT_CLASS =
  'rounded-lg border border-gray-300 bg-white p-3 text-black dark:border-gray-600 dark:bg-gray-800 dark:text-white';

export function TextField({ label, error, ...props }: TextFieldProps) {
  return (
    <View className="mb-1">
      {label && <Text className="mb-1 text-black dark:text-dark-text">{label}</Text>}
      <TextInput
        className={`${INPUT_CLASS} ${error ? 'border-red-500 dark:border-red-500' : ''}`}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
      <Text className="mb-1 mt-1 text-sm text-red-500">{error ?? ' '}</Text>
    </View>
  );
}

/** Password input with a show/hide visibility toggle. */
export function PasswordField({ label, error, ...props }: TextFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <View className="mb-1">
      {label && <Text className="mb-1 text-black dark:text-dark-text">{label}</Text>}
      <View className="relative">
        <TextInput
          className={`${INPUT_CLASS} pr-12 ${error ? 'border-red-500 dark:border-red-500' : ''}`}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={!visible}
          {...props}
        />
        <Pressable
          className="absolute bottom-0 right-0 top-0 justify-center px-3"
          onPress={() => setVisible((v) => !v)}
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          hitSlop={8}
        >
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color="#9CA3AF" />
        </Pressable>
      </View>
      <Text className="mb-1 mt-1 text-sm text-red-500">{error ?? ' '}</Text>
    </View>
  );
}
