import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { fontSize, fontWeight, borderRadius, spacing, type ThemeColors } from '../../constants/theme';

type PillVariant = 'success' | 'warning' | 'error' | 'muted' | 'accent';

interface StatusPillProps { label: string; variant: PillVariant; }

export function StatusPill({ label, variant }: StatusPillProps) {
  const { colors } = useTheme();
  const s = createStyles(colors, variant);
  return <View style={s.pill}><Text style={s.label}>{label}</Text></View>;
}

const VARIANT_COLORS: Record<PillVariant, (c: ThemeColors) => { bg: string; text: string; border: string }> = {
  success: (c) => ({ bg: c.statusOpen + '18', text: c.statusOpen, border: c.statusOpen + '40' }),
  warning: (c) => ({ bg: c.accent + '18', text: c.accent, border: c.accent + '40' }),
  error: (c) => ({ bg: c.statusClosed + '18', text: c.statusClosed, border: c.statusClosed + '40' }),
  muted: (c) => ({ bg: c.surface2, text: c.textMuted, border: c.surfaceBorder }),
  accent: (c) => ({ bg: c.accent + '18', text: c.accent, border: c.accent + '50' }),
};

const createStyles = (colors: ThemeColors, variant: PillVariant) => {
  const vc = VARIANT_COLORS[variant](colors);
  return StyleSheet.create({
    pill: { backgroundColor: vc.bg, borderWidth: 1, borderColor: vc.border, borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 3, alignSelf: 'flex-start' },
    label: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: vc.text, textTransform: 'uppercase', letterSpacing: 0.5 },
  });
};
