import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../../src/theme';
import { useI18n } from '../../src/i18n';

interface TabIconProps {
  icon: string;
  label: string;
  focused: boolean;
  activeColor: string;
  inactiveColor: string;
  accent: string;
}

function TabIcon({ icon, label, focused, activeColor, inactiveColor, accent }: TabIconProps) {
  const scale = useSharedValue(1);
  const pillWidth = useSharedValue(focused ? 1 : 0);
  const dotOpacity = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    if (focused) {
      // Bounce: shrink then spring back bigger
      scale.value = withSpring(1, { damping: 4, stiffness: 300 }, () => {
        scale.value = withSpring(1, { damping: 8, stiffness: 200 });
      });
      scale.value = 0.7;
      pillWidth.value = withSpring(1, { damping: 12, stiffness: 180 });
      dotOpacity.value = withTiming(1, { duration: 200 });
    } else {
      pillWidth.value = withTiming(0, { duration: 150 });
      dotOpacity.value = withTiming(0, { duration: 100 });
    }
  }, [dotOpacity, focused, pillWidth, scale]);

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(scale.value, [0.7, 1], [0.7, 1]) }],
    opacity: interpolate(pillWidth.value, [0, 1], [0.55, 1]),
  }));

  const pillStyle = useAnimatedStyle(() => ({
    backgroundColor: activeColor + interpolate(pillWidth.value, [0, 1], [0, 32]).toFixed(0).padStart(2, '0'),
    borderColor: activeColor + interpolate(pillWidth.value, [0, 1], [0, 64]).toFixed(0).padStart(2, '0'),
    borderWidth: interpolate(pillWidth.value, [0, 1], [0, 1]),
    width: interpolate(pillWidth.value, [0, 1], [32, 46]),
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
  }));

  return (
    <View style={styles.iconWrapper}>
      <Animated.View style={[styles.iconPill, pillStyle]}>
        <Animated.Text style={[styles.emoji, emojiStyle]}>{icon}</Animated.Text>
      </Animated.View>
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
      <Animated.View style={[styles.activeDot, { backgroundColor: accent }, dotStyle]} />
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
  const { translate } = useI18n();

  const tabContent = (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '700', color: colors.text },
        headerShadowVisible: false,
        tabBarShowLabel: false,
        tabBarStyle: {
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
          title: translate('tabs.home'),
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="🏠" label={translate('tabs.home')} focused={focused}
              activeColor={colors.primary} inactiveColor={colors.textMuted} accent={colors.accent}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: translate('tabs.groups'),
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="👥" label={translate('tabs.groups')} focused={focused}
              activeColor={colors.primary} inactiveColor={colors.textMuted} accent={colors.accent}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: translate('tabs.history'),
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="📋" label={translate('tabs.history')} focused={focused}
              activeColor={colors.primary} inactiveColor={colors.textMuted} accent={colors.accent}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: translate('tabs.feed'),
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="📰" label={translate('tabs.feed')} focused={focused}
              activeColor={colors.primary} inactiveColor={colors.textMuted} accent={colors.accent}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: translate('tabs.profile'),
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="👤" label={translate('tabs.profile')} focused={focused}
              activeColor={colors.primary} inactiveColor={colors.textMuted} accent={colors.accent}
            />
          ),
        }}
      />
    </Tabs>
  );

  return tabContent;
}
