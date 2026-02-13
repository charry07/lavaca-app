import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius, fontSize } from '../src/constants/theme';
import { formatCOP } from '@lavaca/shared';
import { useI18n } from '../src/i18n';
import { LanguageSwitcher } from '../src/components/LanguageSwitcher';
import { VacaLogo } from '../src/components/VacaLogo';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <LanguageSwitcher />

      <View style={styles.hero}>
        <VacaLogo size="lg" />
        <Text style={styles.tagline}>
          {t('home.tagline')}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('home.quickExample')}</Text>
        <Text style={styles.cardText}>
          {t('home.totalBill')} {formatCOP(35000)}
        </Text>
        <Text style={styles.cardText}>
          {t('home.perPerson', { count: 7, amount: formatCOP(5000) })}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/create')}>
          <Text style={styles.buttonText}>{t('home.createTable')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => router.push('/join')}
        >
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
            {t('home.joinTable')}
          </Text>
        </TouchableOpacity>
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
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
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
