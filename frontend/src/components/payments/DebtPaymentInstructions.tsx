import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import type { DebtSummary } from '@lavaca/types';
import { formatCOP } from '@lavaca/types';
import { useI18n } from '../../i18n';
import { useTheme } from '../../theme';
import { borderRadius, fontSize, fontWeight, spacing, type ThemeColors } from '../../constants/theme';
import { PaymentAccountCard } from './PaymentAccountCard';

interface DebtPaymentInstructionsProps {
  debts: DebtSummary[];
  loading?: boolean;
  onMarkPaid?: (debt: DebtSummary) => void;
}

export function DebtPaymentInstructions({ debts, loading = false, onMarkPaid }: DebtPaymentInstructionsProps) {
  const { translate } = useI18n();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  if (!debts.length) return null;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>{translate('debt.yourPayments')}</Text>
      {debts.map((debt) => (
        <View key={`${debt.sessionId}:${debt.debtorId}`} style={styles.card}>
          <Text style={styles.line}>{translate('debt.youOwe')} <Text style={styles.creditor}>{debt.creditorDisplayName}</Text></Text>
          <Text style={styles.amount}>{formatCOP(debt.amount)}</Text>

          <Text style={styles.methodsTitle}>{translate('debt.availableMethods')}</Text>

          {debt.creditorAccounts.length === 0 ? (
            <Text style={styles.empty}>{debt.creditorDisplayName} {translate('debt.noMethods')}</Text>
          ) : (
            <View style={styles.methodsList}>
              {debt.creditorAccounts.map((account) => (
                <PaymentAccountCard key={account.id} account={account} editable={false} />
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.markBtn, loading && { opacity: 0.5 }]}
            onPress={() => onMarkPaid?.(debt)}
            disabled={loading}
          >
            <Text style={styles.markBtnText}>{translate('debt.markPaid')}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      margin: spacing.md,
      marginTop: 0,
      gap: spacing.sm,
    },
    title: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.bold,
      textTransform: 'uppercase',
      color: colors.textMuted,
      letterSpacing: 0.8,
    },
    card: {
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      borderLeftWidth: 3,
      borderLeftColor: colors.warning,
      backgroundColor: colors.surface2,
      padding: spacing.md,
      gap: spacing.xs,
    },
    line: {
      color: colors.textSecondary,
      fontSize: fontSize.sm,
    },
    creditor: {
      color: colors.text,
      fontWeight: fontWeight.bold,
    },
    amount: {
      color: colors.accent,
      fontSize: fontSize.xl,
      fontWeight: fontWeight.black,
    },
    methodsTitle: {
      marginTop: spacing.xs,
      color: colors.textMuted,
      fontSize: fontSize.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.7,
    },
    methodsList: {
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    empty: {
      color: colors.textSecondary,
      fontSize: fontSize.sm,
      marginTop: spacing.xs,
    },
    markBtn: {
      marginTop: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.md,
      backgroundColor: colors.primary,
      paddingVertical: spacing.sm,
    },
    markBtnText: {
      color: colors.background,
      fontWeight: fontWeight.bold,
      fontSize: fontSize.sm,
    },
  });
