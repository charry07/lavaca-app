import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';
import { borderRadius, fontSize, fontWeight, spacing } from '../constants/theme';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
      {onRetry && (
        <TouchableOpacity
          style={[styles.button, { borderColor: colors.primary }]}
          onPress={onRetry}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, { color: colors.primary }]}>Reintentar</Text>
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
  icon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  button: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
  },
  buttonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
});
