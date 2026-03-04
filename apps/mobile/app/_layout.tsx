import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, LogBox, View } from 'react-native';

// Suppress known library warnings from react-native-screens / react-navigation
// that pass pointerEvents as a prop instead of in style (fixed in future versions)
LogBox.ignoreLogs([
  'props.pointerEvents is deprecated',
  'pointerEvents is deprecated',
]);
import { I18nProvider, useI18n } from '../src/i18n';
import { ThemeProvider, useTheme } from '../src/theme';
import { AuthProvider, useAuth } from '../src/auth';
import { HeaderControls } from '../src/components/HeaderControls';
import { ToastProvider } from '../src/components/Toast';
import { AppErrorBoundary } from '../src/components/AppErrorBoundary';

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
  }, [user, isLoading, segments]);

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
  const { t } = useI18n();
  const { colors, isDark } = useTheme();

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
              title: t('nav.createTable'),
              presentation: 'modal',
              headerRight: () => <HeaderControls />,
            }}
          />
          <Stack.Screen
            name="join"
            options={{
              title: t('nav.joinTable'),
              presentation: 'modal',
              headerRight: () => <HeaderControls />,
            }}
          />
          <Stack.Screen
            name="session/[joinCode]"
            options={{
              title: t('nav.theTable'),
              headerRight: () => <HeaderControls />,
            }}
          />
          <Stack.Screen
            name="group/[id]"
            options={{
              title: t('tabs.groups'),
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
