import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '../theme';
import { useI18n } from '../i18n';
import { spacing, fontSize, fontWeight, borderRadius, type ThemeColors } from '../constants/theme';

const NAV_ITEMS = [
  { href: '/', label: 'nav.home', icon: '🏠' },
  { href: '/feed', label: 'nav.feed', icon: '📣' },
  { href: '/groups', label: 'nav.groups', icon: '👥' },
  { href: '/history', label: 'nav.history', icon: '📋' },
  { href: '/profile', label: 'nav.profile', icon: '👤' },
] as const;

export function WebSidebar() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const s = createStyles(colors);

  if (Platform.OS !== 'web') return null;

  return (
    <View style={s.sidebar}>
      <View style={s.logo}>
        <Text style={s.logoText}>🐄 La Vaca</Text>
      </View>
      <View style={s.nav}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href === '/' && pathname === '/index');
          return (
            <TouchableOpacity
              key={item.href}
              style={[s.navItem, active && s.navItemActive]}
              onPress={() => router.push(item.href as any)}
            >
              <Text style={s.navIcon}>{item.icon}</Text>
              <Text style={[s.navLabel, active && s.navLabelActive]}>{t(item.label as any)}</Text>
              {active && <View style={s.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    sidebar: {
      width: 220,
      height: '100%' as any,
      backgroundColor: colors.surface,
      borderRightWidth: 1,
      borderRightColor: colors.surfaceBorder,
      paddingTop: spacing.xl,
      paddingHorizontal: spacing.md,
    },
    logo: { paddingHorizontal: spacing.sm, marginBottom: spacing.xl },
    logoText: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
    nav: { gap: spacing.xs },
    navItem: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
      paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.md, position: 'relative',
    },
    navItemActive: { backgroundColor: colors.primary + '14' },
    navIcon: { fontSize: 18 },
    navLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.textSecondary, flex: 1 },
    navLabelActive: { color: colors.primary, fontWeight: fontWeight.semibold },
    activeIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  });
