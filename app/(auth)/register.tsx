import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import OAuthButtons from '@/components/OAuthButtons';
import Button from '@/components/ui/Button';
import { PasswordField, TextField } from '@/components/ui/TextField';
import { trackEvent } from '@/services/analytics';
import { register, sendVerificationEmail, toAuthFieldError } from '@/services/auth';
import { useQuizStore } from '@/store';
import { RegisterForm, registerSchema } from '@/utils/validation';

export default function RegisterScreen() {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });
  const setUser = useQuizStore((s) => s.setUser);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (data: RegisterForm) => {
    setSubmitting(true);
    try {
      const user = await register(data.name, data.email, data.password);
      trackEvent(user.$id, 'register');
      // Best effort; the user can resend from Settings if delivery fails.
      sendVerificationEmail().catch(() => {});
      setUser(user);
      router.replace('/home');
    } catch (error) {
      const { field, message } = toAuthFieldError(error);
      if (field) {
        setError(field, { message });
      } else {
        Toast.show({ type: 'error', text1: 'Registration failed', text2: message });
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
          <Text className="mb-2 text-center text-3xl font-bold text-primary dark:text-dark-text">
            Create account
          </Text>
          <Text className="mb-8 text-center text-gray-500 dark:text-gray-400">
            Save what you learn. Never forget it.
          </Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                placeholder="Name"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.name?.message}
                autoComplete="name"
                editable={!submitting}
              />
            )}
          />
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
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <PasswordField
                placeholder="Password (min. 8 characters)"
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
                placeholder="Confirm Password"
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
            title="Register"
            icon="person-add-outline"
            onPress={handleSubmit(onSubmit)}
            loading={submitting}
            className="mb-4"
          />
          <OAuthButtons onLoggedIn={setUser} disabled={submitting} />
          <Pressable onPress={() => router.push('/login')} disabled={submitting}>
            <Text className="text-center text-secondary dark:text-accent">
              Already have an account? Login
            </Text>
          </Pressable>
          <Pressable
            className="mt-4"
            onPress={() => router.push('/privacy')}
            disabled={submitting}
          >
            <Text className="text-center text-xs text-gray-500 underline dark:text-gray-400">
              By creating an account you agree to our privacy policy
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
