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
import { requestPasswordReset, toAuthErrorMessage } from '@/services/auth';
import { EMAIL_PATTERN } from '@/utils/validation';

type FormData = {
  email: string;
};

export default function ForgotPasswordScreen() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ defaultValues: { email: '' } });
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      await requestPasswordReset(data.email.trim());
      setSent(true);
    } catch (error) {
      // Don't reveal whether an email is registered (prevents enumeration).
      const message = toAuthErrorMessage(error);
      if (message === 'No account found with this email.') {
        setSent(true);
      } else {
        Toast.show({ type: 'error', text1: 'Request failed', text2: message });
      }
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
          Reset password
        </Text>
        {sent ? (
          <>
            <Text className="mb-8 text-center text-gray-500 dark:text-gray-400">
              If an account exists for that email, a reset link is on its way. Open it on this
              device to choose a new password.
            </Text>
            <Pressable className="rounded-lg bg-primary p-3" onPress={() => router.back()}>
              <Text className="text-center font-semibold text-white">Back to login</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text className="mb-8 text-center text-gray-500 dark:text-gray-400">
              Enter your email and we&apos;ll send you a reset link.
            </Text>
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
            <Pressable
              className={`mb-4 rounded-lg p-3 ${submitting ? 'bg-primary/60' : 'bg-primary'}`}
              onPress={handleSubmit(onSubmit)}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-center font-semibold text-white">Send reset link</Text>
              )}
            </Pressable>
            <Pressable onPress={() => router.back()} disabled={submitting}>
              <Text className="text-center text-secondary dark:text-accent">Back to login</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
