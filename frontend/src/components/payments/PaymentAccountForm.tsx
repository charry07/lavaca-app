import { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Switch, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { AccountType, PaymentAccount } from '@lavaca/types';
import { useI18n } from '../../i18n';
import { useTheme } from '../../theme';
import { borderRadius, fontSize, fontWeight, spacing, type ThemeColors } from '../../constants/theme';
import { COLOMBIA_BANKS, OTHER_BANK_VALUE, TOP_COLOMBIA_BANKS } from '../../constants/colombiaBanks';

export type PaymentAccountInput = {
  methodType: AccountType;
  accountHolderName: string;
  bankName?: string;
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

const LLAVE_DETAIL_PREFIX = 'LLAVE_DETAIL::';
const LLAVE_TYPE_PREFIX = 'LLAVE_TYPE::';

export function PaymentAccountForm({ visible, loading = false, initialValue, onClose, onSubmit }: PaymentAccountFormProps) {
  const { colors } = useTheme();
  const { translate } = useI18n();
  const styles = createStyles(colors);

  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [transferKey, setTransferKey] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [notes, setNotes] = useState('');
  const [isPreferred, setIsPreferred] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!visible) return;
    if (!initialValue) {
      setAccountHolderName('');
      setBankName('');
      setSelectedBank('');
      setShowBankPicker(false);
      setBankSearch('');
      setTransferKey('');
      setDocumentId('');
      setNotes('');
      setIsPreferred(false);
      setFormError('');
      return;
    }

    setAccountHolderName(initialValue.accountHolderName);
    const initialBank = initialValue.bankName || '';
    setBankName(initialBank);
    setSelectedBank(COLOMBIA_BANKS.includes(initialBank) ? initialBank : (initialBank ? OTHER_BANK_VALUE : ''));
    setShowBankPicker(false);
    setBankSearch('');
    setTransferKey((initialValue.llave || initialValue.accountNumber || '').trim());
    setDocumentId(initialValue.documentId || '');
    const initialNotes = initialValue.notes || '';
    const lines = initialNotes.split('\n');
    const cleanNotes = lines
      .filter((line) => !line.startsWith(LLAVE_DETAIL_PREFIX) && !line.startsWith(LLAVE_TYPE_PREFIX))
      .join('\n')
      .trim();
    setNotes(cleanNotes);
    setIsPreferred(initialValue.isPreferred);
    setFormError('');
  }, [visible, initialValue]);

  const showBankFields = true;
  const showBankCustomInput = selectedBank === OTHER_BANK_VALUE;
  const filteredBanks = COLOMBIA_BANKS.filter((bank) => bank.toLowerCase().includes(bankSearch.trim().toLowerCase()));

  const title = useMemo(() => (initialValue ? translate('payment.editMethod') : translate('payment.addMethod')), [initialValue, translate]);

  const handleSave = async () => {
    if (!accountHolderName.trim()) {
      setFormError(translate('payment.holderRequired'));
      return;
    }
    if (showBankFields && !selectedBank) {
      setFormError(translate('payment.bankRequired'));
      return;
    }
    if (showBankCustomInput && !bankName.trim()) {
      setFormError(translate('payment.bankOtherNameRequired'));
      return;
    }
    if (!transferKey.trim()) {
      setFormError(translate('payment.accountOrLlaveRequired'));
      return;
    }
    setFormError('');
    const normalizedBankName = showBankFields
      ? (showBankCustomInput ? bankName.trim() : selectedBank)
      : undefined;
    const normalizedNotes = notes.trim();

    await onSubmit({
      methodType: 'bank_account',
      accountHolderName: accountHolderName.trim(),
      bankName: normalizedBankName || undefined,
      llave: transferKey.trim() || undefined,
      documentId: documentId.trim() || undefined,
      notes: normalizedNotes || undefined,
      isPreferred,
    });
  };

  const handleSelectBank = (bank: string) => {
    setSelectedBank(bank);
    setShowBankPicker(false);
    if (bank !== OTHER_BANK_VALUE) {
      setBankName(bank);
    } else {
      setBankName('');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>

          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            {!!formError && <Text style={styles.errorText}>{formError}</Text>}

            <Text style={styles.label}>{translate('payment.holderLabel')}</Text>
            <TextInput style={styles.input} value={accountHolderName} onChangeText={setAccountHolderName} />

            {showBankFields && (
              <>
                <Text style={styles.catalogHint}>{translate('payment.bankCatalogHint')}</Text>
                <Text style={styles.label}>{translate('payment.bankLabel')}</Text>
                <TouchableOpacity style={styles.inputButton} onPress={() => setShowBankPicker(true)}>
                  <Text style={[styles.inputButtonLabel, !selectedBank && styles.inputButtonPlaceholder]}>
                    {selectedBank ? (selectedBank === OTHER_BANK_VALUE ? translate('payment.bankOther') : selectedBank) : translate('payment.bankSelectPlaceholder')}
                  </Text>
                  <Feather name='chevron-down' size={16} color={colors.textMuted} />
                </TouchableOpacity>

                {showBankCustomInput && (
                  <>
                    <Text style={styles.label}>{translate('payment.bankOtherNameLabel')}</Text>
                    <TextInput
                      style={styles.input}
                      value={bankName}
                      onChangeText={setBankName}
                      placeholder={translate('payment.bankOtherNamePlaceholder')}
                      placeholderTextColor={colors.textMuted}
                    />

                    <Text style={styles.label}>{translate('payment.bankDetailLabel')}</Text>
                    <TextInput
                      style={[styles.input, styles.multilineInput]}
                      value={notes}
                      onChangeText={setNotes}
                      placeholder={translate('payment.bankDetailPlaceholder')}
                      placeholderTextColor={colors.textMuted}
                      multiline
                    />
                  </>
                )}

                <Text style={styles.label}>{translate('payment.accountOrLlaveLabel')}</Text>
                <TextInput
                  style={styles.input}
                  value={transferKey}
                  onChangeText={setTransferKey}
                  placeholder={translate('payment.accountOrLlavePlaceholder')}
                  placeholderTextColor={colors.textMuted}
                />
              </>
            )}

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

      <Modal visible={showBankPicker} animationType='slide' transparent onRequestClose={() => setShowBankPicker(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.title}>{translate('payment.bankSelectTitle')}</Text>

            <TextInput
              style={styles.input}
              value={bankSearch}
              onChangeText={setBankSearch}
              placeholder={translate('payment.bankSearchPlaceholder')}
              placeholderTextColor={colors.textMuted}
              autoCapitalize='words'
            />

            <ScrollView contentContainerStyle={styles.bankList} keyboardShouldPersistTaps='handled'>
              {bankSearch.trim().length === 0 && (
                <>
                  <Text style={styles.bankSectionTitle}>{translate('payment.bankTopTitle')}</Text>
                  {TOP_COLOMBIA_BANKS.map((bank) => (
                    <TouchableOpacity key={`top-${bank}`} style={styles.bankOption} onPress={() => handleSelectBank(bank)}>
                      <Text style={styles.bankOptionLabel}>{bank}</Text>
                      {selectedBank === bank ? <Feather name='check' size={16} color={colors.primary} /> : null}
                    </TouchableOpacity>
                  ))}
                  <Text style={styles.bankSectionTitle}>{translate('payment.bankAllTitle')}</Text>
                </>
              )}

              {filteredBanks.map((bank) => (
                <TouchableOpacity key={bank} style={styles.bankOption} onPress={() => handleSelectBank(bank)}>
                  <Text style={styles.bankOptionLabel}>{bank}</Text>
                  {selectedBank === bank ? <Feather name='check' size={16} color={colors.primary} /> : null}
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={styles.bankOption} onPress={() => handleSelectBank(OTHER_BANK_VALUE)}>
                <Text style={styles.bankOptionLabel}>{translate('payment.bankOther')}</Text>
                {selectedBank === OTHER_BANK_VALUE ? <Feather name='check' size={16} color={colors.primary} /> : null}
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowBankPicker(false)}>
              <Text style={styles.cancelBtnText}>{translate('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    errorText: {
      color: colors.danger,
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      marginBottom: spacing.xs,
    },
    catalogHint: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
      marginTop: spacing.xs,
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
    multilineInput: {
      minHeight: 84,
      textAlignVertical: 'top',
    },
    inputButton: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.sm,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 42,
    },
    inputButtonLabel: {
      color: colors.text,
      fontSize: fontSize.sm,
      flex: 1,
      paddingRight: spacing.xs,
    },
    inputButtonPlaceholder: {
      color: colors.textMuted,
    },
    bankList: {
      gap: spacing.xs,
      paddingBottom: spacing.md,
      paddingTop: spacing.sm,
    },
    bankSectionTitle: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },
    bankOption: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.sm,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 44,
    },
    bankOptionLabel: {
      color: colors.text,
      fontSize: fontSize.sm,
      flex: 1,
      paddingRight: spacing.sm,
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
