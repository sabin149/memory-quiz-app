import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import StrengthBar from '@/components/StrengthBar';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { useQuizStore } from '@/store';
import { computeStreak, levelFromXp } from '@/utils/gamification';
import { memoryStrength } from '@/utils/memoryStrength';
import { isDue } from '@/utils/sm2';

/** Urgency-aware due badge: the lower the remaining strength, the louder. */
function DueBadge({ strength }: { strength: number }) {
  const fading = strength <= 25;
  return (
    <View
      className={`rounded-full px-2 py-1 ${
        fading ? 'bg-red-100 dark:bg-red-500/20' : 'bg-orange-100 dark:bg-orange-500/20'
      }`}
    >
      <Text
        className={`text-xs font-semibold ${
          fading ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
        }`}
      >
        {fading ? 'Fading fast' : 'Due'}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const { conversations, remoteAvailable, gamification } = useQuizStore();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState('');

  const streak = computeStreak(gamification.activity);
  const level = levelFromXp(gamification.totalXp);
  const dueCount = conversations.filter((c) => isDue(c.memory)).length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) => c.title.toLowerCase().includes(q) || c.content.toLowerCase().includes(q)
    );
  }, [conversations, query]);

  const handleDocumentPick = async () => {
    setUploading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return; // user changed their mind; not an error

      const asset = result.assets[0];
      const content = (await FileSystem.readAsStringAsync(asset.uri)).trim();
      if (!content) {
        Alert.alert('Empty file', 'The selected file has no text content.');
        return;
      }
      router.push({ pathname: '/edit', params: { fileUri: asset.uri, fileName: asset.name } });
    } catch (error) {
      Alert.alert('Upload failed', 'Could not read the selected file.');
      console.error('Document pick failed', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View className="flex-1 bg-background px-4 pt-4 dark:bg-dark-bg sm:px-6">
      {!remoteAvailable && (
        <View className="mb-2 flex-row items-center justify-center">
          <Ionicons name="cloud-offline-outline" size={14} color="#9CA3AF" />
          <Text className="ml-1 text-center text-xs text-gray-500 dark:text-gray-400">
            Offline — changes sync when the backend is reachable.
          </Text>
        </View>
      )}

      <Pressable onPress={() => router.push('/stats')} accessibilityRole="button">
        <Card className="mb-3 flex-row items-center justify-between py-3">
          <View className="flex-row items-center">
            <Ionicons name="flame" size={18} color="#FF6F61" />
            <Text className="ml-1 font-semibold text-black dark:text-dark-text">{streak}</Text>
            <Ionicons name="ribbon-outline" size={16} color="#4B5EAA" style={{ marginLeft: 12 }} />
            <Text className="ml-1 font-semibold text-black dark:text-dark-text">
              Lv {level.level}
            </Text>
            <Ionicons name="star-outline" size={16} color="#FFD166" style={{ marginLeft: 12 }} />
            <Text className="ml-1 font-semibold text-black dark:text-dark-text">
              {gamification.totalXp}
            </Text>
          </View>
          {dueCount > 0 && (
            <View className="rounded-full bg-secondary/10 px-3 py-1">
              <Text className="text-xs font-semibold text-secondary">{dueCount} due</Text>
            </View>
          )}
        </Card>
      </Pressable>

      <View className="mb-3 flex-row items-center gap-2">
        <View className="flex-1 flex-row items-center rounded-lg border border-gray-300 bg-white px-3 dark:border-gray-600 dark:bg-gray-800">
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            className="flex-1 p-2.5 text-black dark:text-white"
            placeholder="Search conversations"
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            accessibilityLabel="Search conversations"
          />
        </View>
        <Pressable
          className="h-11 w-11 items-center justify-center rounded-lg bg-primary active:opacity-80"
          onPress={() => router.push('/edit')}
          accessibilityRole="button"
          accessibilityLabel="Add conversation"
        >
          <Ionicons name="add" size={26} color="#fff" />
        </Pressable>
        <Pressable
          className={`h-11 w-11 items-center justify-center rounded-lg bg-green-500 active:opacity-80 ${uploading ? 'opacity-60' : ''}`}
          onPress={handleDocumentPick}
          disabled={uploading}
          accessibilityRole="button"
          accessibilityLabel="Upload a text file"
        >
          <Ionicons name="cloud-upload-outline" size={22} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(300)}>
            <Pressable
              onPress={() => router.push({ pathname: '/conversation/[id]', params: { id: item.id } })}
              accessibilityRole="button"
              accessibilityLabel={`Open conversation ${item.title}`}
            >
              <Card className="mb-2">
                <View className="flex-row items-center justify-between">
                  <View className="mr-2 flex-1">
                    <Text
                      className="text-base font-semibold text-black dark:text-dark-text"
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text className="mt-0.5 text-xs text-gray-500 dark:text-gray-400" numberOfLines={1}>
                      {new Date(item.createdAt).toLocaleDateString()} ·{' '}
                      {item.content.split(/\s+/).length} words
                      {item.tagged ? ' · tagged' : ''}
                    </Text>
                  </View>
                  {isDue(item.memory) && item.memory.lastReviewedAt ? (
                    <DueBadge strength={memoryStrength(item.memory)} />
                  ) : isDue(item.memory) ? (
                    <View className="rounded-full bg-blue-100 px-2 py-1 dark:bg-blue-500/20">
                      <Text className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        New
                      </Text>
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                  )}
                </View>
                <StrengthBar memory={item.memory} />
              </Card>
            </Pressable>
          </Animated.View>
        )}
        ListEmptyComponent={
          query ? (
            <EmptyState title="No matches." hint="Try a different search term." />
          ) : (
            <EmptyState
              title="Your library is empty."
              hint="Tap + to save notes or an AI chat, or upload a text file. Saved items appear here and get quizzed on a schedule."
            />
          )
        }
      />
    </View>
  );
}
