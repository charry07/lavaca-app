import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect } from 'react';
import { ActivityIndicator, LogBox, View } from 'react-native';
import * as Linking from 'expo-linking';
import { I18nProvider, useI18n } from '../src/i18n';
import { ThemeProvider, useTheme } from '../src/theme';
import { AuthProvider, useAuth } from '../src/auth';
import { HeaderControls, ToastProvider, AppErrorBoundary } from '../src/components';
import { registerPushToken, addNotificationResponseListener } from '../src/services/notifications';

// Suppress known library warnings from react-native-screens / react-navigation
// that pass pointerEvents as a prop instead of in style (fixed in future versions)
LogBox.ignoreLogs([
  'props.pointerEvents is deprecated',
  'pointerEvents is deprecated',
]);

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login';

    if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, isLoading, router, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

function RootLayoutInner() {
  const { translate } = useI18n();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const handleDeepLink = useCallback((url: string) => {
    try {
      const parsed = Linking.parse(url);
      const code = parsed.queryParams?.code as string | undefined;
      if (code) {
        router.push(`/session/${code}` as never);
      }
    } catch {}
  }, [router]);

  // Cold-start deep link (app opened from closed state via link)
  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });
  }, [handleDeepLink]);

  // Warm-start deep link (app in background, link tapped)
  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });
    return () => subscription.remove();
  }, [handleDeepLink]);

  // Register push token when user logs in
  useEffect(() => {
    if (user?.id) {
      registerPushToken(user.id);
    }
  }, [user?.id]);

  // Handle notification taps
  useEffect(() => {
    const subscription = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data as { joinCode?: string };
      if (data?.joinCode) {
        router.push(`/session/${data.joinCode}` as never);
      }
    });
    return () => subscription.remove();
  }, [router]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AuthGuard>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.primary,
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: colors.background },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen
            name="login"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="create"
            options={{
              title: translate('nav.createTable'),
              presentation: 'modal',
              headerRight: () => <HeaderControls />,
            }}
          />
          <Stack.Screen
            name="join"
            options={{
              title: translate('nav.joinTable'),
              presentation: 'modal',
              headerRight: () => <HeaderControls />,
            }}
          />
          <Stack.Screen
            name="session/[joinCode]"
            options={{
              title: translate('nav.theTable'),
              headerRight: () => <HeaderControls />,
            }}
          />
          <Stack.Screen
            name="group/[id]"
            options={{
              title: translate('tabs.groups'),
              headerBackVisible: true,
              headerRight: () => <HeaderControls />,
            }}
          />
        </Stack>
      </AuthGuard>
    </>
  );
}

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <ToastProvider>
              <RootLayoutInner />
            </ToastProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  );
}
