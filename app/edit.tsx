import ConversationForm from '@/components/ConversationForm'; // Adjust path as needed
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
export default function EditScreen() {
  const { content } = useLocalSearchParams<{ content: string }>();

  return (
    <View className="flex-1">
      <ConversationForm initialContent={content || ''} />
    </View>
  );
}