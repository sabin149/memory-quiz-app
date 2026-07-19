import React from 'react';
import { View, ViewProps } from 'react-native';

export default function Card({ className = '', children, ...rest }: ViewProps & { className?: string }) {
  return (
    <View className={`rounded-lg bg-white p-4 shadow dark:bg-gray-800 ${className}`} {...rest}>
      {children}
    </View>
  );
}
