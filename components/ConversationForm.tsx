import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useQuizStore } from '@/store';

interface ConversationFormProps {
  initialTitle?: string;
  initialContent?: string;
  /** Called after a conversation is saved. Defaults to staying on the current screen. */
  onSaved?: () => void;
}

type FormData = {
  title: string;
  content: string;
};

export default function ConversationForm({
  initialTitle = '',
  initialContent = '',
  onSaved,
}: ConversationFormProps) {
  const addConversation = useQuizStore((s) => s.addConversation);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: { title: initialTitle, content: initialContent },
  });

  const onSubmitForm = (data: FormData) => {
    addConversation({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: data.title.trim(),
      content: data.content.trim(),
      tagged: false,
      createdAt: new Date().toISOString(),
    });
    Toast.show({ type: 'success', text1: 'Saved', text2: 'Conversation added.' });
    reset({ title: '', content: '' });
    onSaved?.();
  };

  return (
    <View className="px-0 py-4">
      <Text className="mb-4 text-2xl font-bold text-primary dark:text-dark-text">
        Add conversation
      </Text>
      <Controller
        control={control}
        name="title"
        rules={{
          required: 'Title is required',
          validate: (v) => v.trim().length > 0 || 'Title is required',
        }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="mb-1 rounded-lg border border-gray-300 bg-white p-3 text-black dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            placeholder="Conversation title"
            placeholderTextColor="#9CA3AF"
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      <Text className="mb-2 text-red-500">{errors.title?.message ?? ' '}</Text>
      <Controller
        control={control}
        name="content"
        rules={{
          required: 'Content is required',
          validate: (v) => v.trim().length > 0 || 'Content is required',
        }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="mb-1 h-40 rounded-lg border border-gray-300 bg-white p-3 text-black dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            placeholder="Paste or edit content here"
            placeholderTextColor="#9CA3AF"
            value={value}
            onChangeText={onChange}
            multiline
            textAlignVertical="top"
          />
        )}
      />
      <Text className="mb-2 text-red-500">{errors.content?.message ?? ' '}</Text>
      <Pressable className="rounded-lg bg-green-500 p-3" onPress={handleSubmit(onSubmitForm)}>
        <Text className="text-center font-semibold text-white">Save</Text>
      </Pressable>
    </View>
  );
}
