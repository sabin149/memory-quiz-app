import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { completePasswordReset, toAuthErrorMessage } from '@/services/auth';

type FormData = {
  password: string;
  confirmPassword: string;
};

/** Deep-link target of the password recovery email (userId + secret params). */
export default function ResetPasswordScreen() {
  const { userId, secret } = useLocalSearchParams<{ userId?: string; secret?: string }>();
  const router = useRouter();
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({ defaultValues: { password: '', confirmPassword: '' } });
  const [submitting, setSubmitting] = useState(false);
  const password = watch('password');

  const linkValid = Boolean(userId && secret);

  const onSubmit = async (data: FormData) => {
    if (!userId || !secret) return;
    setSubmitting(true);
    try {
      await completePasswordReset(userId, secret, data.password);
      Toast.show({
        type: 'success',
        text1: 'Password updated',
        text2: 'Log in with your new password.',
      });
      router.replace('/login');
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Reset failed', text2: toAuthErrorMessage(error) });
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
          Choose a new password
        </Text>
        {!linkValid ? (
          <>
            <Text className="mb-8 text-center text-gray-500 dark:text-gray-400">
              This reset link is invalid or incomplete. Request a new one from the login screen.
            </Text>
            <Pressable
              className="rounded-lg bg-primary p-3"
              onPress={() => router.replace('/login')}
            >
              <Text className="text-center font-semibold text-white">Go to login</Text>
            </Pressable>
          </>
        ) : (
          <>
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
                  placeholder="New password (min. 8 characters)"
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
                  placeholder="Confirm new password"
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
              className={`rounded-lg p-3 ${submitting ? 'bg-primary/60' : 'bg-primary'}`}
              onPress={handleSubmit(onSubmit)}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-center font-semibold text-white">Update password</Text>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
