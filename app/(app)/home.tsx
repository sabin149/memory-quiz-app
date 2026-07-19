import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import ConversationForm from '@/components/ConversationForm';
import StrengthBar from '@/components/StrengthBar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { logout } from '@/services/auth';
import { useQuizStore } from '@/store';
import { computeStreak, levelFromXp } from '@/utils/gamification';
import { isDue } from '@/utils/sm2';

export default function HomeScreen() {
  const {
    conversations,
    tagConversation,
    removeConversation,
    clearUserData,
    remoteAvailable,
    isAdmin,
    gamification,
  } = useQuizStore();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const streak = computeStreak(gamification.activity);
  const level = levelFromXp(gamification.totalXp);
  const dueCount = conversations.filter((c) => isDue(c.memory)).length;

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
      clearUserData();
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
      {!remoteAvailable && (
        <Text className="mb-2 text-center text-xs text-gray-500 dark:text-gray-400">
          Offline — changes are saved on this device and sync when the backend is reachable.
        </Text>
      )}

      <Pressable onPress={() => router.push('/stats')}>
        <Card className="mb-4 flex-row items-center justify-between py-3">
          <Text className="font-semibold text-black dark:text-dark-text">
            {streak}🔥 streak · Lv {level.level} · {gamification.totalXp} XP
          </Text>
          <Text className="text-sm text-secondary dark:text-accent">
            {dueCount > 0 ? `${dueCount} due →` : 'Progress →'}
          </Text>
        </Card>
      </Pressable>

      <ConversationForm />
      <Button
        title={uploading ? 'Reading file…' : 'Upload a text file'}
        variant="success"
        onPress={handleDocumentPick}
        loading={uploading}
        className="mb-4"
      />
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card className="mb-2">
            <View className="flex-row items-center justify-between">
              <View className="mr-2 flex-1">
                <Text className="text-lg text-black dark:text-dark-text" numberOfLines={1}>
                  {item.title}
                </Text>
                {isDue(item.memory) && (
                  <Text className="text-xs font-semibold text-orange-500">Due for review</Text>
                )}
              </View>
              <View className="flex-row gap-2">
                <Pressable
                  className={`rounded-lg p-2 ${item.tagged ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-600'}`}
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
            <StrengthBar memory={item.memory} />
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState
            title="No conversations yet."
            hint="Add one above or upload a text file — then quiz yourself on it."
          />
        }
      />
      <Button
        title="Settings"
        variant="secondary"
        onPress={() => router.push('/settings')}
        className="mt-4"
      />
      {isAdmin && (
        <Pressable
          className="mt-4 rounded-lg bg-purple-600 p-3 active:opacity-80"
          onPress={() => router.push('/admin')}
        >
          <Text className="text-center font-semibold text-white">Admin portal</Text>
        </Pressable>
      )}
      <Button
        title={signingOut ? 'Logging out…' : 'Logout'}
        variant="danger"
        onPress={handleLogout}
        loading={signingOut}
        className="mt-4"
      />
    </View>
  );
}
