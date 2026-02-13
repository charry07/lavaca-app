import { Tabs } from 'expo-router';
import { useTheme } from '../../src/theme';
import { useI18n } from '../../src/i18n';

export default function TabLayout() {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.surfaceBorder,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ focused }) => null,
          tabBarLabel: `🏠 ${t('tabs.home')}`,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: t('tabs.groups'),
          tabBarIcon: ({ focused }) => null,
          tabBarLabel: `👥 ${t('tabs.groups')}`,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('tabs.history'),
          tabBarIcon: ({ focused }) => null,
          tabBarLabel: `📋 ${t('tabs.history')}`,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: t('tabs.feed'),
          tabBarIcon: ({ focused }) => null,
          tabBarLabel: `📰 ${t('tabs.feed')}`,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ focused }) => null,
          tabBarLabel: `👤 ${t('tabs.profile')}`,
        }}
      />
    </Tabs>
  );
}
