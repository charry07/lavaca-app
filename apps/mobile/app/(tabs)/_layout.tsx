import { Tabs } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../src/theme';
import { useI18n } from '../../src/i18n';
import { WebSidebar } from '../../src/components';

interface TabIconProps {
  icon: string;
  label: string;
  focused: boolean;
  activeColor: string;
  inactiveColor: string;
  accent: string;
}

function TabIcon({ icon, label, focused, activeColor, inactiveColor, accent }: TabIconProps) {
  return (
    <View style={styles.iconWrapper}>
      <View style={[
        styles.iconPill,
        focused && { backgroundColor: activeColor + '20', borderColor: activeColor + '40', borderWidth: 1 },
      ]}>
        <Text style={[styles.emoji, { opacity: focused ? 1 : 0.55 }]}>{icon}</Text>
      </View>
      <Text
        style={[
          styles.iconLabel,
          { color: focused ? activeColor : inactiveColor },
          focused && styles.iconLabelActive,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {focused && (
        <View style={[styles.activeDot, { backgroundColor: accent }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    width: 64,
    gap: 2,
  },
  iconPill: {
    width: 46,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  emoji: { fontSize: 17, lineHeight: 22 },
  iconLabel: { fontSize: 10, fontWeight: '500', letterSpacing: 0.1 },
  iconLabelActive: { fontWeight: '700' },
  // Golden dorado dot — the signature accent on active tabs
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 1,
  },
});

export default function TabLayout() {
  const { colors } = useTheme();
  const { t } = useI18n();

  const isWeb = Platform.OS === 'web';

  const tabContent = (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '700', color: colors.text },
        headerShadowVisible: false,
        tabBarShowLabel: false,
        tabBarStyle: isWeb ? { display: 'none' } : {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.surfaceBorder,
          elevation: 0,
          height: Platform.OS === 'ios' ? 82 : 64,
          paddingBottom: Platform.OS === 'ios' ? 20 : 6,
          paddingTop: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="🏠" label={t('tabs.home')} focused={focused}
              activeColor={colors.primary} inactiveColor={colors.textMuted} accent={colors.accent}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: t('tabs.groups'),
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="👥" label={t('tabs.groups')} focused={focused}
              activeColor={colors.primary} inactiveColor={colors.textMuted} accent={colors.accent}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('tabs.history'),
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="📋" label={t('tabs.history')} focused={focused}
              activeColor={colors.primary} inactiveColor={colors.textMuted} accent={colors.accent}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: t('tabs.feed'),
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="📰" label={t('tabs.feed')} focused={focused}
              activeColor={colors.primary} inactiveColor={colors.textMuted} accent={colors.accent}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="👤" label={t('tabs.profile')} focused={focused}
              activeColor={colors.primary} inactiveColor={colors.textMuted} accent={colors.accent}
            />
          ),
        }}
      />
    </Tabs>
  );

  if (isWeb) {
    return (
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <WebSidebar />
        <View style={{ flex: 1 }}>
          {tabContent}
        </View>
      </View>
    );
  }

  return tabContent;
}
