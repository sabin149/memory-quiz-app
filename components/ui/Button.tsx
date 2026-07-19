import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
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

export default function Button({
  title,
  onPress,
  variant = 'primary',
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
        <Text className={`text-center ${LABEL[variant]}`}>{title}</Text>
      )}
    </Pressable>
  );
}
