import { useQuizStore } from "@/store";
import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "react-native";
import Toast from 'react-native-toast-message';
import "./globals.css";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user } = useQuizStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user && pathname !== "/login" && pathname !== "/register") {
      router.replace("/login");
    } else if (user && (pathname === "/login" || pathname === "/register")) {
      router.replace("/home");
    }
  }, [user, pathname, router]);

  return user || pathname === "/login" || pathname === "/register" ? (
    <>{children}</>
  ) : null;
}

export default function RootLayout() {
  return (
    <>
      <StatusBar hidden={true} />
      <AuthGuard>
        <Stack>
          <Stack.Screen name="login" options={{ title: "Login" }} />
          <Stack.Screen name="register" options={{ title: "Register" }} />
          <Stack.Screen name="home" options={{ title: "Conversations" }} />
          <Stack.Screen name="quiz" options={{ title: "Quiz" }} />
          <Stack.Screen name="settings" options={{ title: "Settings" }} />
        </Stack>
        <Toast position="bottom" bottomOffset={50} />
      
      </AuthGuard>
    </>
  );
}
