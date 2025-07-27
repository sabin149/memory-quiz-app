import { Redirect, useRouter } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useQuizStore } from '../store';


type FormData = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterScreen() {
  const { control, handleSubmit, watch, formState: { errors, isSubmitted } } = useForm<FormData>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onSubmit',
  });
  const { login, user } = useQuizStore();
  const router = useRouter();
  const password = watch('password');

  // If already logged in, redirect to home
  if (user) {
    return <Redirect href="/home" />;
  }

  const onSubmit = (data: FormData) => {
    if (data.password !== data.confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Passwords do not match',
      });
      return;
    }
    login(data.email, data.password);
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'Registered successfully!',
    });
    router.replace('/home');
  };

  return (
    <View className="flex-1 justify-center px-4 sm:px-6 bg-background dark:bg-dark-bg">
      <Text className="text-3xl font-bold text-center mb-6 text-primary dark:text-dark-text">Register</Text>
      <Controller
        control={control}
        name="name"
        rules={{ required: 'Name is required' }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4 bg-white dark:bg-gray-800 dark:border-gray-600"
            placeholder="Name"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {isSubmitted && errors.name && <Text className="text-red-500 mb-2">{errors.name.message}</Text>}
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
        name="phone"
        rules={{
          required: 'Phone is required',
          pattern: { value: /^\d{10}$/, message: 'Invalid phone number' },
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4 bg-white dark:bg-gray-800 dark:border-gray-600"
            placeholder="Phone"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            keyboardType="phone-pad"
          />
        )}
      />
      {isSubmitted && errors.phone && <Text className="text-red-500 mb-2">{errors.phone.message}</Text>}
      <Controller
        control={control}
        name="password"
        rules={{ required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } }}
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
      <Controller
        control={control}
        name="confirmPassword"
        rules={{ required: 'Confirm password is required', validate: (value) => value === password || 'Passwords do not match' }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4 bg-white dark:bg-gray-800 dark:border-gray-600"
            placeholder="Confirm Password"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            secureTextEntry
          />
        )}
      />
      {isSubmitted && errors.confirmPassword && <Text className="text-red-500 mb-2">{errors.confirmPassword.message}</Text>}
      <Pressable
        className="bg-primary rounded-lg p-3 mb-4"
        onPress={handleSubmit(onSubmit)}
      >
        <Text className="text-white text-center font-semibold">Register</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/login')}>
        <Text className="text-secondary text-center dark:text-accent">Already have an account? Login</Text>
      </Pressable>
    </View>
  );
}