import React from 'react';
import { View, Text } from 'react-native';
import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../src/store/authStore';
import { useNotificationSetup } from '../src/hooks/useNotificationSetup';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: string | null }
> {
  state: { error: string | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error: error.message + '\n' + error.stack };
  }

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#000' }}>
          <Text selectable style={{ color: '#ff0000', fontSize: 11 }}>
            {this.state.error}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  useNotificationSetup();
  const initialize = useAuthStore((state) => state.initialize);
  const session = useAuthStore((state) => state.session);
  const isLoading = useAuthStore((state) => state.isLoading);
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isLoading) return;
    if (session) {
      router.replace('/(app)');
    } else {
      router.replace('/(auth)/login');
    }
  }, [session, isLoading]);

  return (
    <AppErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </GestureHandlerRootView>
    </AppErrorBoundary>
  );
}
