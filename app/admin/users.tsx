import { Ionicons } from '@expo/vector-icons';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Button from '@/components/ui/Button';
import { computeUserSummaries, UserSummary } from '@/utils/adminStats';
import { useAdminActivity } from './index';

const columnHelper = createColumnHelper<UserSummary>();

const COLUMNS = [
  columnHelper.accessor('ownerId', {
    header: 'User id',
    cell: (info) => info.getValue().slice(0, 12) + '…',
    meta: { flex: 2 },
  }),
  columnHelper.accessor('lastActiveAt', {
    header: 'Last active',
    cell: (info) => new Date(info.getValue()).toLocaleDateString(),
    meta: { flex: 1.4 },
  }),
  columnHelper.accessor('eventCount', { header: 'Events', meta: { flex: 1 } }),
  columnHelper.accessor('quizzes', { header: 'Quizzes', meta: { flex: 1 } }),
  columnHelper.accessor('avgScorePct', {
    header: 'Avg %',
    cell: (info) => (info.getValue() != null ? `${info.getValue()}%` : '—'),
    sortUndefined: 'last',
    meta: { flex: 1 },
  }),
];

export default function AdminUsersScreen() {
  const router = useRouter();
  const { data, isPending, isError, refetch } = useAdminActivity();
  const [sorting, setSorting] = useState<SortingState>([{ id: 'lastActiveAt', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');

  const users = useMemo(
    () => (data ? computeUserSummaries(data.events, data.attempts) : []),
    [data]
  );

  const table = useReactTable({
    data: users,
    columns: COLUMNS,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  if (isError) {
    return (
      <View className="flex-1 justify-center bg-background px-6 dark:bg-dark-bg">
        <Text className="mb-4 text-center text-gray-500 dark:text-gray-400">
          Could not load user activity.
        </Text>
        <Button title="Retry" icon="refresh-outline" onPress={() => refetch()} />
      </View>
    );
  }

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-background dark:bg-dark-bg">
        <ActivityIndicator />
      </View>
    );
  }

  const { pageIndex, pageSize } = table.getState().pagination;
  const filteredCount = table.getFilteredRowModel().rows.length;

  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-dark-bg"
      contentContainerClassName="px-4 py-6 sm:px-6"
    >
      <Text className="mb-3 text-xs text-gray-500 dark:text-gray-400">
        {users.length} active user{users.length === 1 ? '' : 's'} in the last 30 days ·
        identified by user id only
      </Text>

      <View className="mb-3 flex-row items-center rounded-lg border border-gray-300 bg-white px-3 dark:border-gray-600 dark:bg-gray-800">
        <Ionicons name="search-outline" size={16} color="#9CA3AF" />
        <TextInput
          className="flex-1 p-2.5 text-black dark:text-white"
          placeholder="Filter by user id"
          placeholderTextColor="#9CA3AF"
          value={globalFilter}
          onChangeText={setGlobalFilter}
          autoCapitalize="none"
          accessibilityLabel="Filter users by id"
        />
      </View>

      {/* Horizontal scroller: five columns need ~560px; phones have ~360. */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ minWidth: 560, flex: 1 }}>
          {/* Header row: tap a column to sort, tap again to flip direction. */}
          <View className="flex-row rounded-t-lg bg-primary/10 px-3 py-2 dark:bg-primary/20">
            {table.getHeaderGroups()[0].headers.map((header) => {
              const sorted = header.column.getIsSorted();
              const flex = (header.column.columnDef.meta as { flex?: number })?.flex ?? 1;
              return (
                <Pressable
                  key={header.id}
                  className="flex-row items-center"
                  style={{ flex }}
                  onPress={header.column.getToggleSortingHandler()}
                  accessibilityRole="button"
                  accessibilityLabel={`Sort by ${header.column.columnDef.header}`}
                >
                  <Text
                    className="text-xs font-bold text-primary dark:text-dark-text"
                    numberOfLines={1}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </Text>
                  {sorted && (
                    <Ionicons
                      name={sorted === 'asc' ? 'caret-up' : 'caret-down'}
                      size={11}
                      color="#4B5EAA"
                      style={{ marginLeft: 2 }}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>

          {table.getRowModel().rows.map((row) => (
            <Pressable
              key={row.id}
              className="flex-row border-b border-gray-100 bg-white px-3 py-3 active:opacity-70 dark:border-gray-800 dark:bg-gray-900"
              onPress={() =>
                router.push({
                  pathname: '/admin/user/[userId]',
                  params: { userId: row.original.ownerId },
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`Open activity for user ${row.original.ownerId}`}
            >
              {row.getVisibleCells().map((cell) => {
                const flex = (cell.column.columnDef.meta as { flex?: number })?.flex ?? 1;
                return (
                  <Text
                    key={cell.id}
                    style={{ flex }}
                    className="text-xs text-gray-700 dark:text-gray-300"
                    numberOfLines={1}
                  >
                    {flexRender(cell.column.columnDef.cell ?? String(cell.getValue() ?? ''), cell.getContext())}
                  </Text>
                );
              })}
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {filteredCount === 0 && (
        <Text className="mt-6 text-center text-gray-500 dark:text-gray-400">
          No matching users.
        </Text>
      )}

      {filteredCount > pageSize && (
        <View className="mt-3 flex-row items-center justify-between">
          <Button
            title="Previous"
            variant="ghost"
            onPress={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          />
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            Page {pageIndex + 1} of {table.getPageCount()} · {filteredCount} users
          </Text>
          <Button
            title="Next"
            variant="ghost"
            onPress={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          />
        </View>
      )}
    </ScrollView>
  );
}
