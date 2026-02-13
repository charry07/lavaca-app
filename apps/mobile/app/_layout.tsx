import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../src/constants/theme';

export default function RootLayout() {
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
          options={{ title: 'Crear Mesa', presentation: 'modal' }}
        />
        <Stack.Screen
          name="join"
          options={{ title: 'Unirme a Mesa', presentation: 'modal' }}
        />
        <Stack.Screen
          name="session/[joinCode]"
          options={{ title: 'La Mesa' }}
        />
      </Stack>
    </>
  );
}
