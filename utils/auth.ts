import AsyncStorage from '@react-native-async-storage/async-storage';

const STATIC_TOKEN = 'my-static-token';

export const setToken = async (token: string) => {
  await AsyncStorage.setItem('authToken', token);
};

export const getToken = async () => {
  return await AsyncStorage.getItem('authToken');
};

export const removeToken = async () => {
  await AsyncStorage.removeItem('authToken');
};

export const isAuthenticated = async () => {
  const token = await getToken();
  return token === STATIC_TOKEN;
};