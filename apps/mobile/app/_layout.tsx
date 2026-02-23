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

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login';
    const inTabs = segments[0] === '(tabs)';

    if (!user && !inAuthGroup) {
      // Not logged in — go to login
      router.replace('/login');
    } else if (user && inAuthGroup) {
      // Logged in but on login page — go home
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }}>
        <ActivityIndicator size="large" color="#4ade80" />
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
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <ToastProvider>
            <RootLayoutInner />
          </ToastProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
