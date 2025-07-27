import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import ConversationForm from '../components/ConversationForm';
import { useQuizStore } from '../store';

export default function HomeScreen() {
  const { conversations, tagConversation, logout, user } = useQuizStore();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  if (!user) {
    return (
      <View className="flex-1 justify-center px-4 sm:px-6 bg-background dark:bg-dark-bg">
        <Text className="text-xl text-center text-primary dark:text-dark-text">Please log in to continue</Text>
        <Pressable 
          className="bg-primary rounded-lg p-3 mt-4"
          onPress={() => router.push('/login')}
        >
          <Text className="text-white text-center font-semibold">Go to Login</Text>
        </Pressable>
      </View>
    );
  }

  const handleDocumentPick = async () => {
    setUploading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/*',
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets.length > 0 && !result.canceled) {
        const asset = result.assets[0];
        const response = await fetch(asset.uri);
        const content = await response.text();
        if (content.trim()) {
          router.push({
            pathname: '/edit',
            params: { content: content.trim() },
          });
        } else {
          Alert.alert('Error', 'The uploaded file is empty.');
        }
      } else {
        Alert.alert('Upload Cancelled', 'No file was selected.');
      }
    } catch (error) {
      Alert.alert('Upload Error', 'Failed to upload document.');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View className="flex-1 px-4 sm:px-6 py-10 bg-background dark:bg-dark-bg">
      <Text className="text-3xl font-bold text-center mb-6 text-primary dark:text-dark-text">Conversations</Text>
      <ConversationForm />
      <Pressable
        className="bg-green-500 rounded-lg p-3 mb-4"
        onPress={handleDocumentPick}
        disabled={uploading}
      >
        <Text className="text-white text-center font-semibold">
          {uploading ? 'Uploading...' : 'Upload File'}
        </Text>
      </Pressable>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="flex-row justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-lg mb-2 shadow">
            <Text className="text-lg text-black dark:text-dark-text">{item.title}</Text>
            <View className="flex-row gap-2">
              <Pressable
                className={`rounded-lg p-2 ${item.tagged ? 'bg-yellow-500' : 'bg-gray-300'}`}
                onPress={() => tagConversation(item.id)}
              >
                <Text className="text-white">{item.tagged ? 'Untag' : 'Tag'}</Text>
              </Pressable>
              <Pressable
                className="bg-blue-500 rounded-lg p-2"
                onPress={() => router.push({ pathname: '/quiz', params: { conversationId: item.id } })}
              >
                <Text className="text-white">Quiz</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text className="text-gray-500 text-center dark:text-gray-400">No conversations yet</Text>}
      />
      <Pressable
        className="bg-secondary rounded-lg p-3 mt-4"
        onPress={() => router.push('/settings')}
      >
        <Text className="text-white text-center font-semibold">Settings</Text>
      </Pressable>
      <Pressable
        className="bg-red-500 rounded-lg p-3 mt-4"
        onPress={() => {
          logout();
          router.replace('/login');
        }}
      >
        <Text className="text-white text-center font-semibold">Logout</Text>
      </Pressable>
    </View>
  );
}