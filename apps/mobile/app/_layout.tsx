import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../src/constants/theme';
import { I18nProvider, useI18n } from '../src/i18n';

function RootLayoutInner() {
  const { t } = useI18n();

  return (
    <>
      <StatusBar style="light" />
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
          name="index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="create"
          options={{ title: t('nav.createTable'), presentation: 'modal' }}
        />
        <Stack.Screen
          name="join"
          options={{ title: t('nav.joinTable'), presentation: 'modal' }}
        />
        <Stack.Screen
          name="session/[joinCode]"
          options={{ title: t('nav.theTable') }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <I18nProvider>
      <RootLayoutInner />
    </I18nProvider>
  );
}
