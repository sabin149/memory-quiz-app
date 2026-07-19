import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  /** Optional Ionicons name rendered before the label. */
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

const CONTAINER: Record<Variant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  success: 'bg-green-500',
  danger: 'bg-red-500',
  outline: 'border border-red-500 bg-transparent',
  ghost: 'bg-transparent',
};

const LABEL: Record<Variant, string> = {
  primary: 'text-white font-semibold',
  secondary: 'text-white font-semibold',
  success: 'text-white font-semibold',
  danger: 'text-white font-semibold',
  outline: 'text-red-500 font-semibold',
  ghost: 'text-secondary dark:text-accent',
};

const ICON_COLOR: Record<Variant, string> = {
  primary: '#fff',
  secondary: '#fff',
  success: '#fff',
  danger: '#fff',
  outline: '#EF4444',
  ghost: '#FF6F61',
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  className = '',
}: ButtonProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      className={`rounded-lg p-3 active:opacity-80 ${CONTAINER[variant]} ${inactive ? 'opacity-60' : ''} ${className}`}
      onPress={onPress}
      disabled={inactive}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? undefined : '#fff'} />
      ) : (
        <View className="flex-row items-center justify-center">
          {icon && (
            <Ionicons name={icon} size={18} color={ICON_COLOR[variant]} style={{ marginRight: 8 }} />
          )}
          <Text className={`text-center ${LABEL[variant]}`}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}
