import { TouchableOpacity, View, Text, StyleSheet, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import type { PaymentAccount } from '@lavaca/types';
import { useI18n } from '../../i18n';
import { useTheme } from '../../theme';
import { borderRadius, fontSize, fontWeight, spacing, type ThemeColors } from '../../constants/theme';
import { useToast } from '../feedback/Toast';

interface PaymentAccountCardProps {
  account: PaymentAccount;
  onEdit?: (account: PaymentAccount) => void;
  onDelete?: (accountId: string) => void;
  onSetPreferred?: (accountId: string) => void;
  editable?: boolean;
}

function getMethodLabel(method: PaymentAccount['methodType']): string {
  switch (method) {
    case 'nequi':
      return 'Nequi';
    case 'daviplata':
      return 'Daviplata';
    case 'pse':
      return 'PSE';
    case 'transfiya':
      return 'Transfiya';
    case 'bank_account':
      return 'Cuenta bancaria';
    case 'cash':
      return 'Efectivo';
    default:
      return 'Otro';
  }
}

export function PaymentAccountCard({ account, onEdit, onDelete, onSetPreferred, editable = true }: PaymentAccountCardProps) {
  const { colors } = useTheme();
  const { translate } = useI18n();
  const { showSuccess } = useToast();
  const styles = createStyles(colors);

  const copyValue = async (value: string) => {
    if (!value) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(value);
    } else {
      await Clipboard.setStringAsync(value);
    }
    showSuccess(translate('payment.copied'));
  };

  const bankLine = [account.bankName, account.accountType].filter(Boolean).join(' · ');

  return (
    <View style={[styles.card, account.isPreferred && styles.preferredCard]}>
      <View style={styles.headerRow}>
        <Text style={styles.method}>{getMethodLabel(account.methodType)}</Text>
        {account.isPreferred && <Text style={styles.preferred}>⭐ {translate('payment.preferred')}</Text>}
      </View>

      <Text style={styles.holder}>{account.accountHolderName}</Text>

      {!!bankLine && <Text style={styles.meta}>{bankLine}</Text>}

      {!!account.accountNumber && (
        <TouchableOpacity style={styles.copyRow} onPress={() => copyValue(account.accountNumber || '')}>
          <Text style={styles.copyLabel}>{translate('payment.accountLabel')}</Text>
          <Text style={styles.copyValue}>{account.accountNumber}</Text>
        </TouchableOpacity>
      )}

      {!!account.phone && (
        <TouchableOpacity style={styles.copyRow} onPress={() => copyValue(account.phone || '')}>
          <Text style={styles.copyLabel}>{translate('payment.phoneLabel')}</Text>
          <Text style={styles.copyValue}>{account.phone}</Text>
        </TouchableOpacity>
      )}

      {!!account.llave && (
        <TouchableOpacity style={styles.copyRow} onPress={() => copyValue(account.llave || '')}>
          <Text style={styles.copyLabel}>{translate('payment.llaveLabel')}</Text>
          <Text style={styles.copyValue}>{account.llave}</Text>
        </TouchableOpacity>
      )}

      {!!account.documentId && (
        <TouchableOpacity style={styles.copyRow} onPress={() => copyValue(account.documentId || '')}>
          <Text style={styles.copyLabel}>{translate('payment.documentLabel')}</Text>
          <Text style={styles.copyValue}>{account.documentId}</Text>
        </TouchableOpacity>
      )}

      {editable && (
        <View style={styles.actions}>
          {!account.isPreferred && (
            <TouchableOpacity style={styles.ghostBtn} onPress={() => onSetPreferred?.(account.id)}>
              <Text style={styles.ghostBtnText}>{translate('payment.setPreferred')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.ghostBtn} onPress={() => onEdit?.(account)}>
            <Text style={styles.ghostBtnText}>{translate('payment.editMethod')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ghostBtn, styles.dangerBtn]} onPress={() => onDelete?.(account.id)}>
            <Text style={[styles.ghostBtnText, styles.dangerText]}>{translate('payment.deleteAction')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      padding: spacing.md,
      gap: spacing.xs,
    },
    preferredCard: {
      borderColor: colors.accent,
      borderLeftWidth: 3,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
    },
    method: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.bold,
      color: colors.text,
    },
    preferred: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      color: colors.accent,
    },
    holder: {
      fontSize: fontSize.md,
      color: colors.text,
      fontWeight: fontWeight.semibold,
    },
    meta: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
    },
    copyRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    copyLabel: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      textTransform: 'uppercase',
    },
    copyValue: {
      fontSize: fontSize.sm,
      color: colors.text,
      fontWeight: fontWeight.semibold,
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    ghostBtn: {
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: borderRadius.sm,
      backgroundColor: colors.surface2,
    },
    ghostBtnText: {
      color: colors.textSecondary,
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
    },
    dangerBtn: {
      borderColor: colors.danger + '50',
    },
    dangerText: {
      color: colors.danger,
    },
  });
