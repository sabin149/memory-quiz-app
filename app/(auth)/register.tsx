import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { register, toAuthErrorMessage } from '@/services/auth';
import { useQuizStore } from '@/store';
import { EMAIL_PATTERN } from '@/utils/validation';

type FormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterScreen() {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });
  const setUser = useQuizStore((s) => s.setUser);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const password = watch('password');

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const user = await register(data.name.trim(), data.email.trim(), data.password);
      setUser(user);
      router.replace('/home');
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Registration failed', text2: toAuthErrorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background dark:bg-dark-bg"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="mb-2 text-center text-3xl font-bold text-primary dark:text-dark-text">
          Create account
        </Text>
        <Text className="mb-8 text-center text-gray-500 dark:text-gray-400">
          Save what you learn. Never forget it.
        </Text>
        <Controller
          control={control}
          name="name"
          rules={{ required: 'Name is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="mb-1 rounded-lg border border-gray-300 bg-white p-3 text-black dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="Name"
              placeholderTextColor="#9CA3AF"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              autoComplete="name"
              editable={!submitting}
            />
          )}
        />
        <Text className="mb-3 text-red-500">{errors.name?.message ?? ' '}</Text>
        <Controller
          control={control}
          name="email"
          rules={{
            required: 'Email is required',
            pattern: { value: EMAIL_PATTERN, message: 'Enter a valid email address' },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="mb-1 rounded-lg border border-gray-300 bg-white p-3 text-black dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!submitting}
            />
          )}
        />
        <Text className="mb-3 text-red-500">{errors.email?.message ?? ' '}</Text>
        <Controller
          control={control}
          name="password"
          rules={{
            required: 'Password is required',
            minLength: { value: 8, message: 'Password must be at least 8 characters' },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="mb-1 rounded-lg border border-gray-300 bg-white p-3 text-black dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="Password (min. 8 characters)"
              placeholderTextColor="#9CA3AF"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              secureTextEntry
              autoComplete="new-password"
              editable={!submitting}
            />
          )}
        />
        <Text className="mb-3 text-red-500">{errors.password?.message ?? ' '}</Text>
        <Controller
          control={control}
          name="confirmPassword"
          rules={{
            required: 'Confirm password is required',
            validate: (value) => value === password || 'Passwords do not match',
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="mb-1 rounded-lg border border-gray-300 bg-white p-3 text-black dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="Confirm Password"
              placeholderTextColor="#9CA3AF"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              secureTextEntry
              autoComplete="new-password"
              editable={!submitting}
            />
          )}
        />
        <Text className="mb-3 text-red-500">{errors.confirmPassword?.message ?? ' '}</Text>
        <Pressable
          className={`mb-4 rounded-lg p-3 ${submitting ? 'bg-primary/60' : 'bg-primary'}`}
          onPress={handleSubmit(onSubmit)}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-center font-semibold text-white">Register</Text>
          )}
        </Pressable>
        <Pressable onPress={() => router.push('/login')} disabled={submitting}>
          <Text className="text-center text-secondary dark:text-accent">
            Already have an account? Login
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
