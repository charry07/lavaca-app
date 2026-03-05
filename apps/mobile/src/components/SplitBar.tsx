import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { fontSize, fontWeight, borderRadius, spacing, type ThemeColors } from '../constants/theme';

interface SplitBarProps {
  paid: number;
  total: number;
  amount?: number;
  currency?: string;
}

export function SplitBar({ paid, total, amount, currency = 'COP' }: SplitBarProps) {
  const { colors } = useTheme();
  const s = createStyles(colors);
  const pct = total > 0 ? (paid / total) * 100 : 0;
  return (
    <View style={s.container}>
      <View style={s.track}>
        <View style={[s.fill, { width: `${pct}%` as `${number}%` }]} />
      </View>
      <View style={s.labels}>
        <Text style={s.label}>{paid}/{total} pagaron</Text>
        {amount != null && <Text style={s.amount}>{currency} {amount.toLocaleString('es-CO')}</Text>}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { gap: spacing.xs },
    track: { height: 5, backgroundColor: colors.surface2, borderRadius: borderRadius.full, overflow: 'hidden', borderWidth: 1, borderColor: colors.surfaceBorder },
    fill: { height: '100%', backgroundColor: colors.primary, borderRadius: borderRadius.full },
    labels: { flexDirection: 'row', justifyContent: 'space-between' },
    label: { fontSize: fontSize.xs, color: colors.textMuted },
    amount: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.accent },
  });
