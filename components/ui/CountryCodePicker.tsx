import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';

export interface Country {
  name: string;
  dial: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { name: 'Nepal', dial: '+977', flag: '🇳🇵' },
  { name: 'United States', dial: '+1', flag: '🇺🇸' },
  { name: 'India', dial: '+91', flag: '🇮🇳' },
  { name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
  { name: 'Australia', dial: '+61', flag: '🇦🇺' },
  { name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { name: 'France', dial: '+33', flag: '🇫🇷' },
  { name: 'Japan', dial: '+81', flag: '🇯🇵' },
  { name: 'China', dial: '+86', flag: '🇨🇳' },
  { name: 'Brazil', dial: '+55', flag: '🇧🇷' },
  { name: 'Mexico', dial: '+52', flag: '🇲🇽' },
  { name: 'Netherlands', dial: '+31', flag: '🇳🇱' },
  { name: 'Singapore', dial: '+65', flag: '🇸🇬' },
  { name: 'South Korea', dial: '+82', flag: '🇰🇷' },
  { name: 'Spain', dial: '+34', flag: '🇪🇸' },
  { name: 'Italy', dial: '+39', flag: '🇮🇹' },
  { name: 'Bangladesh', dial: '+880', flag: '🇧🇩' },
  { name: 'Pakistan', dial: '+92', flag: '🇵🇰' },
  { name: 'Sri Lanka', dial: '+94', flag: '🇱🇰' },
  { name: 'United Arab Emirates', dial: '+971', flag: '🇦🇪' },
  { name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦' },
  { name: 'Qatar', dial: '+974', flag: '🇶🇦' },
  { name: 'South Africa', dial: '+27', flag: '🇿🇦' },
  { name: 'Nigeria', dial: '+234', flag: '🇳🇬' },
];

interface CountryCodePickerProps {
  value: Country;
  onChange: (country: Country) => void;
  disabled?: boolean;
}

export default function CountryCodePicker({ value, onChange, disabled }: CountryCodePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dial.includes(q)
    );
  }, [search]);

  const close = () => {
    setOpen(false);
    setSearch('');
  };

  return (
    <>
      <Pressable
        className="mr-2 h-[46px] flex-row items-center rounded-lg border border-gray-300 bg-white px-3 dark:border-gray-600 dark:bg-gray-800"
        onPress={() => setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`Country code ${value.dial}`}
      >
        <Text className="mr-1">{value.flag}</Text>
        <Text className="text-black dark:text-white">{value.dial}</Text>
        <Ionicons name="chevron-down" size={14} color="#9CA3AF" style={{ marginLeft: 4 }} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
        <View className="flex-1 justify-end bg-black/40">
          {/* Tapping the backdrop dismisses the picker. */}
          <Pressable className="flex-1" onPress={close} accessibilityLabel="Close country picker" />
          <View className="max-h-[70%] rounded-t-2xl bg-white p-4 dark:bg-gray-900">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-black dark:text-dark-text">
                Country code
              </Text>
              <Pressable
                onPress={close}
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={12}
              >
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </Pressable>
            </View>
            <View className="mb-2 flex-row items-center rounded-lg border border-gray-300 bg-white px-3 dark:border-gray-600 dark:bg-gray-800">
              <Ionicons name="search-outline" size={16} color="#9CA3AF" />
              <TextInput
                className="flex-1 p-2.5 text-black dark:text-white"
                placeholder="Search country or code"
                placeholderTextColor="#9CA3AF"
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
                accessibilityLabel="Search countries"
              />
            </View>
            <FlatList
              data={filtered}
              keyExtractor={(item) => `${item.name}-${item.dial}`}
              renderItem={({ item }) => (
                <Pressable
                  className="flex-row items-center border-b border-gray-100 py-3 dark:border-gray-800"
                  onPress={() => {
                    onChange(item);
                    close();
                  }}
                  accessibilityRole="button"
                >
                  <Text className="mr-3 text-lg">{item.flag}</Text>
                  <Text className="flex-1 text-black dark:text-dark-text">{item.name}</Text>
                  <Text className="text-gray-500 dark:text-gray-400">{item.dial}</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}
