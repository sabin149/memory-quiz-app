import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Text, View } from 'react-native';

/** App logo: gradient badge + wordmark, used on auth screens. */
export default function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View className="items-center">
      <LinearGradient
        colors={['#5B6FC4', '#3A4A8C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: compact ? 56 : 72,
          height: compact ? 56 : 72,
          borderRadius: compact ? 16 : 20,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#4B5EAA',
          shadowOpacity: 0.35,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        }}
      >
        <Ionicons name="school" size={compact ? 28 : 36} color="#fff" />
      </LinearGradient>
      {!compact && (
        <Text className="mt-3 text-xl font-extrabold tracking-tight text-primary dark:text-dark-text">
          Memory Quiz
        </Text>
      )}
    </View>
  );
}
