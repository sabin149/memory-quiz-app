import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import Toast from 'react-native-toast-message';
import "./globals.css";

export default function RootLayout() {
  return (
    <>
      <StatusBar hidden={true} />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen 
          name="login" 
          options={{ 
            title: "Login",
            headerBackVisible: false,
            gestureEnabled: false 
          }} 
        />
        <Stack.Screen 
          name="register" 
          options={{ 
            title: "Register",
            headerBackVisible: false,
            gestureEnabled: false 
          }} 
        />
        <Stack.Screen 
          name="home" 
          options={{ 
            title: "Conversations",
            headerBackVisible: false,
            gestureEnabled: false 
          }} 
        />
        <Stack.Screen name="quiz" options={{ title: "Quiz" }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
      </Stack>
      <Toast position="bottom" bottomOffset={50} />
    </>
  );
}