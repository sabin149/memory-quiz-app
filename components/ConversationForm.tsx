import { useRouter } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useQuizStore } from '../store';

interface ConversationFormProps {
  initialTitle?: string;
  initialContent?: string;
  onSubmit?: () => void;
}

export default function ConversationForm({ initialTitle = '', initialContent = '', onSubmit }: ConversationFormProps) {
  const { addConversation } = useQuizStore();
  const router = useRouter();
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      title: initialTitle,
      content: initialContent,
    },
  });

  const onSubmitForm = (data: { title: string; content: string }) => {
    if (data.title.trim() && data.content.trim()) {
      addConversation({
        id: `${Date.now()}`,
        title: data.title,
        content: data.content,
        tagged: false,
      });
      if (onSubmit) {
        onSubmit();
      } else {
        router.push('/home');
      }
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill in both title and content.',
      });
    }
  };

  return (
    <View className="px-4 sm:px-6 py-4 bg-background dark:bg-dark-bg">
      <Text className="text-2xl font-bold mb-4 text-primary dark:text-dark-text">Add Conversation</Text>
      <Controller
        control={control}
        name="title"
        rules={{ required: 'Title is required' }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4 bg-white dark:bg-gray-800 dark:border-gray-600 text-black dark:text-white"
            placeholder="Conversation Title"
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      {errors.title && <Text className="text-red-500 mb-2">{errors.title.message}</Text>}
      <Controller
        control={control}
        name="content"
        rules={{ required: 'Content is required' }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4 bg-white dark:bg-gray-800 dark:border-gray-600 text-black dark:text-white h-40"
            placeholder="Paste or Edit Content Here"
            value={value}
            onChangeText={onChange}
            multiline
          />
        )}
      />
      {errors.content && <Text className="text-red-500 mb-2">{errors.content.message}</Text>}
      <Pressable
        className="bg-green-500 rounded-lg p-3"
        onPress={handleSubmit(onSubmitForm)}
      >
        <Text className="text-white text-center font-semibold">Submit</Text>
      </Pressable>
    </View>
  );
}