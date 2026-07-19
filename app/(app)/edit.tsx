import * as FileSystem from 'expo-file-system';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import ConversationForm from '@/components/ConversationForm';

export default function EditScreen() {
  const { fileUri, fileName } = useLocalSearchParams<{ fileUri: string; fileName?: string }>();
  const router = useRouter();
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const text = fileUri ? await FileSystem.readAsStringAsync(fileUri) : '';
      if (!cancelled) setContent(text.trim());
    })();
    return () => {
      cancelled = true;
    };
  }, [fileUri]);

  if (content === null) {
    return (
      <View className="flex-1 items-center justify-center bg-background dark:bg-dark-bg">
        <ActivityIndicator />
      </View>
    );
  }

  const suggestedTitle = fileName ? fileName.replace(/\.[^.]+$/, '') : '';

  return (
    <View className="flex-1 bg-background dark:bg-dark-bg">
      <ConversationForm
        initialTitle={suggestedTitle}
        initialContent={content}
        onSaved={() => router.back()}
      />
    </View>
  );
}
