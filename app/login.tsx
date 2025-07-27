import { useRouter } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useQuizStore } from '../store';

type FormData = {
  email: string;
  password: string;
};

export default function LoginScreen() {
  const { control, handleSubmit, formState: { errors, isSubmitted } } = useForm<FormData>({
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onSubmit',
  });
  const { login } = useQuizStore();
  const router = useRouter();

  const onSubmit = (data: FormData) => {
    login(data.email, data.password);
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'Logged in successfully!',
    });
    router.push('/home');
  };

  return (
    <View className="flex-1 justify-center px-4 sm:px-6 bg-background dark:bg-dark-bg">
      <Text className="text-3xl font-bold text-center mb-6 text-primary dark:text-dark-text">Login</Text>
      <Controller
        control={control}
        name="email"
        rules={{ required: 'Email is required' }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4 bg-white dark:bg-gray-800 dark:border-gray-600"
            placeholder="Email"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        )}
      />
      {isSubmitted && errors.email && <Text className="text-red-500 mb-2">{errors.email.message}</Text>}
      <Controller
        control={control}
        name="password"
        rules={{ required: 'Password is required' }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4 bg-white dark:bg-gray-800 dark:border-gray-600"
            placeholder="Password"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            secureTextEntry
          />
        )}
      />
      {isSubmitted && errors.password && <Text className="text-red-500 mb-2">{errors.password.message}</Text>}
      <Pressable
        className="bg-primary rounded-lg p-3 mb-4"
        onPress={handleSubmit(onSubmit)}
      >
        <Text className="text-white text-center font-semibold">Login</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/register')}>
        <Text className="text-secondary text-center dark:text-accent">Don&apos;t have an account? Register</Text>
      </Pressable>
    </View>
  );
}