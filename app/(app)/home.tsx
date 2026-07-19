import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import ConversationForm from '@/components/ConversationForm';
import StrengthBar from '@/components/StrengthBar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { logout } from '@/services/auth';
import { useQuizStore } from '@/store';
import { computeStreak, levelFromXp } from '@/utils/gamification';
import { isDue } from '@/utils/sm2';

function IconAction({
  icon,
  color,
  bgClass,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgClass: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={`h-9 w-9 items-center justify-center rounded-lg ${bgClass} active:opacity-70`}
      onPress={onPress}
      accessibilityLabel={label}
      hitSlop={4}
    >
      <Ionicons name={icon} size={18} color={color} />
    </Pressable>
  );
}

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
        <View className="mb-2 flex-row items-center justify-center">
          <Ionicons name="cloud-offline-outline" size={14} color="#9CA3AF" />
          <Text className="ml-1 text-center text-xs text-gray-500 dark:text-gray-400">
            Offline — changes are saved on this device and sync when the backend is reachable.
          </Text>
        </View>
      )}

      <Pressable onPress={() => router.push('/stats')}>
        <Card className="mb-4 flex-row items-center justify-between py-3">
          <View className="flex-row items-center">
            <Ionicons name="flame" size={20} color="#FF6F61" />
            <Text className="ml-1 font-semibold text-black dark:text-dark-text">{streak}</Text>
            <Ionicons name="ribbon-outline" size={18} color="#4B5EAA" style={{ marginLeft: 12 }} />
            <Text className="ml-1 font-semibold text-black dark:text-dark-text">
              Lv {level.level}
            </Text>
            <Ionicons name="star-outline" size={18} color="#FFD166" style={{ marginLeft: 12 }} />
            <Text className="ml-1 font-semibold text-black dark:text-dark-text">
              {gamification.totalXp} XP
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-sm text-secondary dark:text-accent">
              {dueCount > 0 ? `${dueCount} due` : 'Progress'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#FF6F61" />
          </View>
        </Card>
      </Pressable>

      <ConversationForm />
      <Button
        title={uploading ? 'Reading file…' : 'Upload a text file'}
        icon="cloud-upload-outline"
        variant="success"
        onPress={handleDocumentPick}
        loading={uploading}
        className="mb-4"
      />
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(300)}>
            <Card className="mb-2">
              <View className="flex-row items-center justify-between">
                <View className="mr-2 flex-1">
                  <Text className="text-lg text-black dark:text-dark-text" numberOfLines={1}>
                    {item.title}
                  </Text>
                  {isDue(item.memory) && (
                    <View className="flex-row items-center">
                      <Ionicons name="alarm-outline" size={12} color="#F97316" />
                      <Text className="ml-1 text-xs font-semibold text-orange-500">
                        Due for review
                      </Text>
                    </View>
                  )}
                </View>
                <View className="flex-row gap-2">
                  <IconAction
                    icon={item.tagged ? 'pricetag' : 'pricetag-outline'}
                    color="#fff"
                    bgClass={item.tagged ? 'bg-yellow-500' : 'bg-gray-400 dark:bg-gray-600'}
                    label={item.tagged ? 'Untag' : 'Tag'}
                    onPress={() => tagConversation(item.id)}
                  />
                  <IconAction
                    icon="school-outline"
                    color="#fff"
                    bgClass="bg-blue-500"
                    label="Start quiz"
                    onPress={() =>
                      router.push({ pathname: '/quiz', params: { conversationId: item.id } })
                    }
                  />
                  <IconAction
                    icon="trash-outline"
                    color="#fff"
                    bgClass="bg-red-400"
                    label="Delete"
                    onPress={() => confirmDelete(item.id, item.title)}
                  />
                </View>
              </View>
              <StrengthBar memory={item.memory} />
            </Card>
          </Animated.View>
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
        icon="settings-outline"
        variant="secondary"
        onPress={() => router.push('/settings')}
        className="mt-4"
      />
      {isAdmin && (
        <Pressable
          className="mt-4 flex-row items-center justify-center rounded-lg bg-purple-600 p-3 active:opacity-80"
          onPress={() => router.push('/admin')}
        >
          <Ionicons name="shield-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text className="text-center font-semibold text-white">Admin portal</Text>
        </Pressable>
      )}
      <Button
        title={signingOut ? 'Logging out…' : 'Logout'}
        icon="log-out-outline"
        variant="danger"
        onPress={handleLogout}
        loading={signingOut}
        className="mt-4"
      />
    </View>
  );
}
