import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { borderRadius, fontSize, fontWeight, spacing } from '../../constants/theme';

interface EmptyStateProps {
  emoji?: string;
  iconName?: keyof typeof Feather.glyphMap;
  title: string;
  hint?: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ emoji, iconName, title, hint, action }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      {iconName ? (
        <View style={[styles.iconWrap, { backgroundColor: colors.surface2, borderColor: colors.surfaceBorder }]}>
          <Feather name={iconName} size={26} color={colors.accent} />
        </View>
      ) : (
        <Text style={styles.emoji}>{emoji || '•'}</Text>
      )}
      <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
      {hint && <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text>}
      {action && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={action.onPress}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: colors.background }]}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 62,
    height: 62,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  hint: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  buttonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
});
