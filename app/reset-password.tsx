import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import Button from '@/components/ui/Button';
import { PasswordField } from '@/components/ui/TextField';
import { completePasswordReset, toAuthErrorMessage } from '@/services/auth';
import { ResetPasswordForm, resetPasswordSchema } from '@/utils/validation';

/** Deep-link target of the password recovery email (userId + secret params). */
export default function ResetPasswordScreen() {
  const { userId, secret } = useLocalSearchParams<{ userId?: string; secret?: string }>();
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });
  const [submitting, setSubmitting] = useState(false);

  const linkValid = Boolean(userId && secret);

  const onSubmit = async (data: ResetPasswordForm) => {
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
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text className="mb-2 text-center text-3xl font-bold text-primary dark:text-dark-text">
            Choose a new password
          </Text>
          {!linkValid ? (
            <>
              <Text className="mb-8 text-center text-gray-500 dark:text-gray-400">
                This reset link is invalid or incomplete. Request a new one from the login screen.
              </Text>
              <Button title="Go to login" onPress={() => router.replace('/login')} />
            </>
          ) : (
            <>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PasswordField
                    placeholder="New password (min. 8 characters)"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.password?.message}
                    autoComplete="new-password"
                    editable={!submitting}
                  />
                )}
              />
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PasswordField
                    placeholder="Confirm new password"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.confirmPassword?.message}
                    autoComplete="new-password"
                    editable={!submitting}
                  />
                )}
              />
              <Button
                title="Update password"
                icon="checkmark-outline"
                onPress={handleSubmit(onSubmit)}
                loading={submitting}
              />
            </>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
