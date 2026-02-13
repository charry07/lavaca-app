import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { colors, spacing, borderRadius, fontSize } from '../src/constants/theme';
import { formatCOP } from '@lavaca/shared';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.emoji}>🐄</Text>
        <Text style={styles.logo}>La Vaca</Text>
        <Text style={styles.tagline}>
          Simple y sencillo de dividir{'\n'}y pagar cuentas
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ejemplo rapido</Text>
        <Text style={styles.cardText}>
          Cuenta total: {formatCOP(35000)}
        </Text>
        <Text style={styles.cardText}>
          Entre 7 personas: {formatCOP(5000)} c/u
        </Text>
      </View>

      <View style={styles.actions}>
        <Link href="/create" asChild>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>🍽️  Crear Mesa</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/join" asChild>
          <TouchableOpacity style={[styles.button, styles.buttonSecondary]}>
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
              🔗  Unirme a Mesa
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emoji: {
    fontSize: 72,
    marginBottom: spacing.sm,
  },
  logo: {
    fontSize: fontSize.hero,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  tagline: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  cardText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  actions: {
    gap: spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.background,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  buttonTextSecondary: {
    color: colors.primary,
  },
});
