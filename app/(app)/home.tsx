import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import ConversationForm from '@/components/ConversationForm';
import { logout } from '@/services/auth';
import { useQuizStore } from '@/store';

export default function HomeScreen() {
  const { conversations, tagConversation, removeConversation, setUser } = useQuizStore();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleDocumentPick = async () => {
    setUploading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return; // user changed their mind; not an error
      }

      const asset = result.assets[0];
      const content = (await FileSystem.readAsStringAsync(asset.uri)).trim();
      if (!content) {
        Alert.alert('Empty file', 'The selected file has no text content.');
        return;
      }
      router.push({
        pathname: '/edit',
        params: { fileUri: asset.uri, fileName: asset.name },
      });
    } catch (error) {
      Alert.alert('Upload failed', 'Could not read the selected file.');
      console.error('Document pick failed', error);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await logout();
    } catch {
      // Session may already be invalid server-side; clear local state regardless.
    } finally {
      setUser(null);
      setSigningOut(false);
    }
  };

  const confirmDelete = (id: string, title: string) => {
    Alert.alert('Delete conversation', `Delete "${title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeConversation(id) },
    ]);
  };

  return (
    <View className="flex-1 bg-background px-4 py-6 dark:bg-dark-bg sm:px-6">
      <ConversationForm />
      <Pressable
        className={`mb-4 rounded-lg p-3 ${uploading ? 'bg-green-500/60' : 'bg-green-500'}`}
        onPress={handleDocumentPick}
        disabled={uploading}
      >
        <Text className="text-center font-semibold text-white">
          {uploading ? 'Reading file…' : 'Upload a text file'}
        </Text>
      </Pressable>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="mb-2 flex-row items-center justify-between rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <Text
              className="mr-2 flex-1 text-lg text-black dark:text-dark-text"
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <View className="flex-row gap-2">
              <Pressable
                className={`rounded-lg p-2 ${item.tagged ? 'bg-yellow-500' : 'bg-gray-300'}`}
                onPress={() => tagConversation(item.id)}
              >
                <Text className="text-white">{item.tagged ? 'Untag' : 'Tag'}</Text>
              </Pressable>
              <Pressable
                className="rounded-lg bg-blue-500 p-2"
                onPress={() =>
                  router.push({ pathname: '/quiz', params: { conversationId: item.id } })
                }
              >
                <Text className="text-white">Quiz</Text>
              </Pressable>
              <Pressable
                className="rounded-lg bg-red-400 p-2"
                onPress={() => confirmDelete(item.id, item.title)}
              >
                <Text className="text-white">Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text className="mt-8 text-center text-gray-500 dark:text-gray-400">
            No conversations yet. Add one above or upload a file.
          </Text>
        }
      />
      <Pressable
        className="mt-4 rounded-lg bg-secondary p-3"
        onPress={() => router.push('/settings')}
      >
        <Text className="text-center font-semibold text-white">Settings</Text>
      </Pressable>
      <Pressable
        className={`mt-4 rounded-lg p-3 ${signingOut ? 'bg-red-500/60' : 'bg-red-500'}`}
        onPress={handleLogout}
        disabled={signingOut}
      >
        <Text className="text-center font-semibold text-white">
          {signingOut ? 'Logging out…' : 'Logout'}
        </Text>
      </Pressable>
    </View>
  );
}
