import * as FileSystem from 'expo-file-system';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import ConversationForm from '@/components/ConversationForm';

/** Add a conversation: blank, or pre-filled from an uploaded text file. */
export default function EditScreen() {
  const { fileUri, fileName } = useLocalSearchParams<{ fileUri?: string; fileName?: string }>();
  const router = useRouter();
  const [content, setContent] = useState<string | null>(fileUri ? null : '');

  useEffect(() => {
    if (!fileUri) return;
    let cancelled = false;
    (async () => {
      const text = await FileSystem.readAsStringAsync(fileUri);
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
    <ScrollView
      className="flex-1 bg-background dark:bg-dark-bg"
      contentContainerClassName="px-4 sm:px-6"
      keyboardShouldPersistTaps="handled"
    >
      <ConversationForm
        initialTitle={suggestedTitle}
        initialContent={content}
        onSaved={() => router.back()}
      />
    </ScrollView>
  );
}
