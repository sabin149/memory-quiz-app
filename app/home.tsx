import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useQuizStore } from '../store';

export default function HomeScreen() {
  const { conversations, addConversation, tagConversation, logout, user } = useQuizStore();
  const router = useRouter();

  if (!user) {
    router.replace('/login');
    return null;
  }

  const handleUpload = () => {
    addConversation({
      id: `${conversations.length + 1}`,
      title: `Conversation ${conversations.length + 1}`,
      content: 'Sample content',
      tagged: false,
    });
  };

  return (
    <View className="flex-1 px-4 sm:px-6 py-10 bg-background dark:bg-dark-bg">
      <Text className="text-3xl font-bold text-center mb-6 text-primary dark:text-dark-text">Conversations</Text>
      <Pressable
        className="bg-green-500 rounded-lg p-3 mb-4"
        onPress={handleUpload}
      >
        <Text className="text-white text-center font-semibold">Upload Conversation</Text>
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
        className="bg-red-500 rounded-lg p-3 mt-4"
        onPress={() => {
          logout();
          router.push('/login');
        }}
      >
        <Text className="text-white text-center font-semibold">Logout</Text>
      </Pressable>
    </View>
  );
}