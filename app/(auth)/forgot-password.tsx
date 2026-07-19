import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import Button from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { requestPasswordReset, toAuthErrorMessage } from '@/services/auth';
import { ForgotPasswordForm, forgotPasswordSchema } from '@/utils/validation';

export default function ForgotPasswordScreen() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (data: ForgotPasswordForm) => {
    setSubmitting(true);
    try {
      await requestPasswordReset(data.email);
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
        <Animated.View entering={FadeInDown.duration(400)}>
          <View className="mb-4 items-center">
            <Ionicons name="key-outline" size={48} color="#4B5EAA" />
          </View>
          <Text className="mb-2 text-center text-3xl font-bold text-primary dark:text-dark-text">
            Reset password
          </Text>
          {sent ? (
            <>
              <Text className="mb-8 text-center text-gray-500 dark:text-gray-400">
                If an account exists for that email, a reset link is on its way. Open it on this
                device to choose a new password.
              </Text>
              <Button title="Back to login" onPress={() => router.back()} />
            </>
          ) : (
            <>
              <Text className="mb-8 text-center text-gray-500 dark:text-gray-400">
                Enter your email and we&apos;ll send you a reset link.
              </Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextField
                    placeholder="Email"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.email?.message}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    editable={!submitting}
                  />
                )}
              />
              <Button
                title="Send reset link"
                icon="mail-outline"
                onPress={handleSubmit(onSubmit)}
                loading={submitting}
                className="mb-4"
              />
              <Pressable onPress={() => router.back()} disabled={submitting}>
                <Text className="text-center text-secondary dark:text-accent">Back to login</Text>
              </Pressable>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
