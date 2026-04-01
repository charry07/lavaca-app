import { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Switch, ScrollView } from 'react-native';
import type { AccountType, BankAccountType, PaymentAccount } from '@lavaca/types';
import { useI18n } from '../../i18n';
import { useTheme } from '../../theme';
import { borderRadius, fontSize, fontWeight, spacing, type ThemeColors } from '../../constants/theme';

export type PaymentAccountInput = {
  methodType: AccountType;
  accountHolderName: string;
  bankName?: string;
  accountNumber?: string;
  accountType?: BankAccountType;
  llave?: string;
  phone?: string;
  documentId?: string;
  notes?: string;
  isPreferred?: boolean;
};

interface PaymentAccountFormProps {
  visible: boolean;
  loading?: boolean;
  initialValue?: PaymentAccount;
  onClose: () => void;
  onSubmit: (value: PaymentAccountInput) => Promise<void> | void;
}

const ACCOUNT_TYPES: AccountType[] = ['nequi', 'daviplata', 'transfiya', 'pse', 'bank_account', 'cash', 'other'];

export function PaymentAccountForm({ visible, loading = false, initialValue, onClose, onSubmit }: PaymentAccountFormProps) {
  const { colors } = useTheme();
  const { translate } = useI18n();
  const styles = createStyles(colors);

  const [methodType, setMethodType] = useState<AccountType>('nequi');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState<BankAccountType>('ahorros');
  const [llave, setLlave] = useState('');
  const [phone, setPhone] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [notes, setNotes] = useState('');
  const [isPreferred, setIsPreferred] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (!initialValue) {
      setMethodType('nequi');
      setAccountHolderName('');
      setBankName('');
      setAccountNumber('');
      setAccountType('ahorros');
      setLlave('');
      setPhone('');
      setDocumentId('');
      setNotes('');
      setIsPreferred(false);
      return;
    }

    setMethodType(initialValue.methodType);
    setAccountHolderName(initialValue.accountHolderName);
    setBankName(initialValue.bankName || '');
    setAccountNumber(initialValue.accountNumber || '');
    setAccountType(initialValue.accountType || 'ahorros');
    setLlave(initialValue.llave || '');
    setPhone(initialValue.phone || '');
    setDocumentId(initialValue.documentId || '');
    setNotes(initialValue.notes || '');
    setIsPreferred(initialValue.isPreferred);
  }, [visible, initialValue]);

  const showBankFields = methodType === 'bank_account';
  const showPhoneField = methodType === 'nequi' || methodType === 'daviplata' || methodType === 'transfiya';

  const title = useMemo(() => (initialValue ? translate('payment.editMethod') : translate('payment.addMethod')), [initialValue, translate]);

  const handleSave = async () => {
    if (!accountHolderName.trim()) return;
    await onSubmit({
      methodType,
      accountHolderName: accountHolderName.trim(),
      bankName: bankName.trim() || undefined,
      accountNumber: accountNumber.trim() || undefined,
      accountType: showBankFields ? accountType : undefined,
      llave: llave.trim() || undefined,
      phone: phone.trim() || undefined,
      documentId: documentId.trim() || undefined,
      notes: notes.trim() || undefined,
      isPreferred,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>

          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>{translate('payment.typeLabel')}</Text>
            <View style={styles.typeGrid}>
              {ACCOUNT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeChip, methodType === type && styles.typeChipActive]}
                  onPress={() => setMethodType(type)}
                >
                  <Text style={[styles.typeChipText, methodType === type && styles.typeChipTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>{translate('payment.holderLabel')}</Text>
            <TextInput style={styles.input} value={accountHolderName} onChangeText={setAccountHolderName} />

            {showBankFields && (
              <>
                <Text style={styles.label}>{translate('payment.bankLabel')}</Text>
                <TextInput style={styles.input} value={bankName} onChangeText={setBankName} />

                <Text style={styles.label}>{translate('payment.accountLabel')}</Text>
                <TextInput style={styles.input} value={accountNumber} onChangeText={setAccountNumber} keyboardType="number-pad" />

                <View style={styles.typeGrid}>
                  <TouchableOpacity
                    style={[styles.typeChip, accountType === 'ahorros' && styles.typeChipActive]}
                    onPress={() => setAccountType('ahorros')}
                  >
                    <Text style={[styles.typeChipText, accountType === 'ahorros' && styles.typeChipTextActive]}>Ahorros</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeChip, accountType === 'corriente' && styles.typeChipActive]}
                    onPress={() => setAccountType('corriente')}
                  >
                    <Text style={[styles.typeChipText, accountType === 'corriente' && styles.typeChipTextActive]}>Corriente</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {showPhoneField && (
              <>
                <Text style={styles.label}>{translate('payment.phoneLabel')}</Text>
                <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              </>
            )}

            <Text style={styles.label}>{translate('payment.llaveLabel')}</Text>
            <TextInput style={styles.input} value={llave} onChangeText={setLlave} />

            <Text style={styles.label}>{translate('payment.documentLabel')}</Text>
            <TextInput style={styles.input} value={documentId} onChangeText={setDocumentId} />

            <View style={styles.switchRow}>
              <Text style={styles.label}>{translate('payment.setPreferred')}</Text>
              <Switch value={isPreferred} onValueChange={setIsPreferred} />
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>{translate('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.5 }]} onPress={handleSave} disabled={loading}>
                <Text style={styles.saveBtnText}>{translate('common.confirmed')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface2,
      borderTopLeftRadius: borderRadius.lg,
      borderTopRightRadius: borderRadius.lg,
      borderTopWidth: 1,
      borderColor: colors.surfaceBorder,
      maxHeight: '88%',
      padding: spacing.md,
    },
    title: {
      fontSize: fontSize.lg,
      color: colors.text,
      fontWeight: fontWeight.bold,
      marginBottom: spacing.sm,
    },
    form: {
      gap: spacing.xs,
      paddingBottom: spacing.md,
    },
    label: {
      color: colors.textSecondary,
      fontSize: fontSize.xs,
      textTransform: 'uppercase',
      marginTop: spacing.sm,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.sm,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      color: colors.text,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      fontSize: fontSize.sm,
    },
    typeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    typeChip: {
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      backgroundColor: colors.surface,
    },
    typeChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '15',
    },
    typeChipText: {
      color: colors.textSecondary,
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
    },
    typeChipTextActive: {
      color: colors.primary,
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    cancelBtn: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm,
    },
    cancelBtnText: {
      color: colors.textSecondary,
      fontWeight: fontWeight.semibold,
    },
    saveBtn: {
      flex: 1,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm,
      backgroundColor: colors.primary,
    },
    saveBtnText: {
      color: colors.background,
      fontWeight: fontWeight.bold,
    },
  });
