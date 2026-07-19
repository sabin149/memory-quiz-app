import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import BrandMark from '@/components/BrandMark';
import OAuthButtons from '@/components/OAuthButtons';
import Button from '@/components/ui/Button';
import { PasswordField, TextField } from '@/components/ui/TextField';
import { trackEvent } from '@/services/analytics';
import { login, toAuthFieldError } from '@/services/auth';
import { useQuizStore } from '@/store';
import { LoginForm, loginSchema } from '@/utils/validation';

export default function LoginScreen() {
  const { t } = useTranslation();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const setUser = useQuizStore((s) => s.setUser);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (data: LoginForm) => {
    setSubmitting(true);
    try {
      const user = await login(data.email, data.password);
      trackEvent(user.$id, 'login');
      setUser(user);
      router.replace('/home');
    } catch (error) {
      const { field, message } = toAuthFieldError(error);
      if (field) {
        setError(field, { message });
      } else {
        Toast.show({ type: 'error', text1: 'Login failed', text2: message });
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
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="w-full max-w-md self-center"
        >
          <View className="mb-6">
            <BrandMark />
          </View>
          <Text className="mb-2 text-center text-3xl font-bold text-primary dark:text-dark-text">
            {t('auth.welcomeBack')}
          </Text>
          <Text className="mb-8 text-center text-gray-500 dark:text-gray-400">
            {t('auth.loginSubtitle')}
          </Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                placeholder={t('auth.email')}
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
                placeholder={t('auth.password')}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
                autoComplete="password"
                editable={!submitting}
              />
            )}
          />
          <Button
            title={t('auth.login')}
            icon="log-in-outline"
            onPress={handleSubmit(onSubmit)}
            loading={submitting}
            className="mb-4"
          />
          <Pressable
            className="mb-4"
            onPress={() => router.push('/forgot-password')}
            disabled={submitting}
          >
            <Text className="text-center text-secondary dark:text-accent">
              {t('auth.forgotPassword')}
            </Text>
          </Pressable>
          <OAuthButtons onLoggedIn={setUser} disabled={submitting} />
          <Pressable onPress={() => router.push('/register')} disabled={submitting}>
            <Text className="text-center text-secondary dark:text-accent">
              {t('auth.noAccount')}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
