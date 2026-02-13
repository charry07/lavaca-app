import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { spacing, borderRadius, fontSize, type ThemeColors } from '../../src/constants/theme';
import { formatCOP } from '@lavaca/shared';
import { useI18n } from '../../src/i18n';
import { useTheme } from '../../src/theme';
import { VacaLogo } from '../../src/components/VacaLogo';
import { HeaderControls } from '../../src/components/HeaderControls';

export default function HomeTab() {
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useTheme();
  const s = createStyles(colors);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <HeaderControls />
      </View>

      <View style={s.hero}>
        <VacaLogo size="lg" />
        <Text style={s.tagline}>{t('home.tagline')}</Text>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>{t('home.quickExample')}</Text>
        <Text style={s.cardText}>
          {t('home.totalBill')} {formatCOP(35000)}
        </Text>
        <Text style={s.cardText}>
          {t('home.perPerson', { count: 7, amount: formatCOP(5000) })}
        </Text>
      </View>

      <View style={s.actions}>
        <TouchableOpacity style={s.button} onPress={() => router.push('/create')}>
          <Text style={s.buttonText}>{t('home.createTable')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.button, s.buttonSecondary]}
          onPress={() => router.push('/join')}
        >
          <Text style={[s.buttonText, s.buttonTextSecondary]}>
            {t('home.joinTable')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: spacing.lg,
      justifyContent: 'center',
    },
    header: {
      position: 'absolute',
      top: spacing.xxl,
      right: spacing.lg,
      zIndex: 10,
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
    actions: {},
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
