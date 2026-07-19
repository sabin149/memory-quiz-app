import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import {
  AccountRecord,
  adminApiAvailable,
  deleteAccount,
  listAccounts,
  setAccountBlocked,
  verifyAccount,
} from '@/services/adminApi';
import { useQuizStore } from '@/store';
import { confirmAction } from '@/utils/confirm';

const PAGE = 25;

function ActionIcon({
  icon,
  color,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      className="ml-2 h-8 w-8 items-center justify-center rounded-lg bg-gray-100 active:opacity-70 dark:bg-gray-700"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
    >
      <Ionicons name={icon} size={16} color={color} />
    </Pressable>
  );
}

export default function AdminManageScreen() {
  const me = useQuizStore((s) => s.user);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const available = adminApiAvailable();

  const { data, isPending, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useInfiniteQuery({
      queryKey: ['admin-accounts', applied],
      enabled: available,
      initialPageParam: undefined as string | undefined,
      queryFn: async ({ pageParam }) =>
        listAccounts({ search: applied || undefined, cursor: pageParam, limit: PAGE }),
      getNextPageParam: (last) =>
        last.users.length === PAGE ? last.users[last.users.length - 1].id : undefined,
    });

  const accounts = data?.pages.flatMap((p) => p.users) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  const act = async (
    account: AccountRecord,
    action: 'block' | 'unblock' | 'verify' | 'delete'
  ) => {
    if (action === 'delete') {
      const confirmed = await confirmAction({
        title: 'Delete user',
        message: `Permanently delete ${account.email} and all their access? This cannot be undone.`,
        confirmLabel: 'Delete user',
        destructive: true,
      });
      if (!confirmed) return;
    }
    setBusyId(account.id);
    try {
      if (action === 'delete') await deleteAccount(account.id);
      else if (action === 'verify') await verifyAccount(account.id);
      else await setAccountBlocked(account.id, action === 'block');
      Toast.show({ type: 'success', text1: `${action} done`, text2: account.email });
      queryClient.invalidateQueries({ queryKey: ['admin-accounts'] });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Action failed',
        text2: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setBusyId(null);
    }
  };

  if (!available) {
    return (
      <View className="flex-1 justify-center bg-background px-6 dark:bg-dark-bg">
        <Card>
          <View className="flex-row items-start">
            <Ionicons name="construct-outline" size={18} color="#EAB308" />
            <Text className="ml-2 flex-1 text-sm text-gray-600 dark:text-gray-300">
              User management needs the admin-api function. Deploy functions/admin-api (see its
              README) and set EXPO_PUBLIC_APPWRITE_ADMIN_FUNCTION_ID.
            </Text>
          </View>
        </Card>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background px-4 py-4 dark:bg-dark-bg sm:px-6">
      <View className="mb-3 flex-row items-center gap-2">
        <View className="flex-1 flex-row items-center rounded-lg border border-gray-300 bg-white px-3 dark:border-gray-600 dark:bg-gray-800">
          <Ionicons name="search-outline" size={16} color="#9CA3AF" />
          <TextInput
            className="flex-1 p-2.5 text-black dark:text-white"
            placeholder="Search name, email, phone, or id"
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => setApplied(search.trim())}
            autoCapitalize="none"
            accessibilityLabel="Search accounts"
          />
        </View>
        <Pressable
          className="rounded-lg bg-primary px-3 py-2.5 active:opacity-80"
          onPress={() => setApplied(search.trim())}
          accessibilityRole="button"
          accessibilityLabel="Apply search"
        >
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </Pressable>
      </View>

      {isError ? (
        <View className="flex-1 justify-center">
          <Text className="mb-4 text-center text-gray-500 dark:text-gray-400">
            Could not load accounts. Is the admin-api function deployed and its API_KEY set?
          </Text>
          <Button title="Retry" icon="refresh-outline" onPress={() => refetch()} />
        </View>
      ) : isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <>
          <Text className="mb-2 text-xs text-gray-500 dark:text-gray-400">
            {total} account{total === 1 ? '' : 's'}
            {applied ? ` matching "${applied}"` : ''}
          </Text>
          <FlatList
            data={accounts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isMe = item.id === me?.$id;
              const busy = busyId === item.id;
              return (
                <Card className="mb-2 py-3">
                  <View className="flex-row items-center">
                    <View className="mr-2 flex-1">
                      <View className="flex-row items-center">
                        <Text
                          className="font-semibold text-black dark:text-dark-text"
                          numberOfLines={1}
                        >
                          {item.name || '(no name)'}
                        </Text>
                        {!item.status && (
                          <View className="ml-2 rounded-full bg-red-100 px-2 py-0.5 dark:bg-red-500/20">
                            <Text className="text-[10px] font-semibold text-red-600 dark:text-red-400">
                              BLOCKED
                            </Text>
                          </View>
                        )}
                        {!item.emailVerification && (
                          <View className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 dark:bg-yellow-500/20">
                            <Text className="text-[10px] font-semibold text-yellow-700 dark:text-yellow-400">
                              UNVERIFIED
                            </Text>
                          </View>
                        )}
                        {isMe && (
                          <View className="ml-2 rounded-full bg-primary/10 px-2 py-0.5">
                            <Text className="text-[10px] font-semibold text-primary">YOU</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-xs text-gray-500 dark:text-gray-400" numberOfLines={1}>
                        {item.email} · joined {new Date(item.registration).toLocaleDateString()}
                      </Text>
                    </View>
                    {busy ? (
                      <ActivityIndicator size="small" />
                    ) : (
                      !isMe && (
                        <View className="flex-row">
                          {!item.emailVerification && (
                            <ActionIcon
                              icon="checkmark-done-outline"
                              color="#22C55E"
                              label={`Verify ${item.email}`}
                              onPress={() => act(item, 'verify')}
                            />
                          )}
                          <ActionIcon
                            icon={item.status ? 'ban-outline' : 'lock-open-outline'}
                            color={item.status ? '#F97316' : '#22C55E'}
                            label={item.status ? `Block ${item.email}` : `Unblock ${item.email}`}
                            onPress={() => act(item, item.status ? 'block' : 'unblock')}
                          />
                          <ActionIcon
                            icon="trash-outline"
                            color="#EF4444"
                            label={`Delete ${item.email}`}
                            onPress={() => act(item, 'delete')}
                          />
                        </View>
                      )
                    )}
                  </View>
                </Card>
              );
            }}
            ListEmptyComponent={
              <Text className="mt-8 text-center text-gray-500 dark:text-gray-400">
                No accounts found.
              </Text>
            }
            ListFooterComponent={
              hasNextPage ? (
                <Button
                  title={isFetchingNextPage ? 'Loading…' : `Load more (${accounts.length} of ${total})`}
                  variant="ghost"
                  onPress={() => fetchNextPage()}
                  loading={isFetchingNextPage}
                />
              ) : null
            }
          />
        </>
      )}
    </View>
  );
}
