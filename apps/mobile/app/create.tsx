import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SplitMode } from '@lavaca/shared';
import { api } from '../src/services/api';
import { spacing, borderRadius, fontSize, type ThemeColors } from '../src/constants/theme';
import { useI18n } from '../src/i18n';
import { useTheme } from '../src/theme';
import { useAuth } from '../src/auth';
import { useToast } from '../src/components/Toast';

export default function CreateScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { showError } = useToast();
  const s = createStyles(colors);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [currency, setCurrency] = useState<'COP' | 'USD' | 'EUR'>('COP');
  const [loading, setLoading] = useState(false);

  const CURRENCIES: { key: 'COP' | 'USD' | 'EUR'; symbol: string }[] = [
    { key: 'COP', symbol: '🇨🇴 COP' },
    { key: 'USD', symbol: '🇺🇸 USD' },
    { key: 'EUR', symbol: '🇪🇺 EUR' },
  ];

  const SPLIT_MODES: { key: SplitMode; label: string; emoji: string }[] = [
    { key: 'equal', label: t('create.equalParts'), emoji: '⚖️' },
    { key: 'percentage', label: t('create.percentage'), emoji: '📊' },
    { key: 'roulette', label: t('create.roulette'), emoji: '🎰' },
  ];

  const handleCreate = async () => {
    const numAmount = Number(amount.replace(/[^0-9]/g, ''));
    if (!numAmount || numAmount <= 0) {
      showError(t('create.invalidAmount'));
      return;
    }

    setLoading(true);
    try {
      const session = await api.createSession({
        adminId: user?.id || 'anonymous',
        totalAmount: numAmount,
        currency,
        splitMode,
        description: description || undefined,
      });

      router.push(`/session/${session.joinCode}`);
    } catch (err: any) {
      showError(err.message || t('create.errorCreating'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.sectionTitle}>{t('create.totalAmount')}</Text>
        <TextInput
          style={s.amountInput}
          placeholder="$0"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          autoFocus
        />

        <Text style={s.sectionTitle}>{t('create.description')}</Text>
        <TextInput
          style={s.input}
          placeholder={t('create.descriptionPlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
        />

        <Text style={s.sectionTitle}>{t('create.currency')}</Text>
        <View style={s.currencyContainer}>
          {CURRENCIES.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={[s.currencyButton, currency === c.key && s.currencyButtonActive]}
              onPress={() => setCurrency(c.key)}
            >
              <Text style={[s.currencyLabel, currency === c.key && s.currencyLabelActive]}>
                {c.symbol}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionTitle}>{t('create.howToSplit')}</Text>
        <View style={s.modeContainer}>
          {SPLIT_MODES.map((mode) => (
            <TouchableOpacity
              key={mode.key}
              style={[
                s.modeButton,
                splitMode === mode.key && s.modeButtonActive,
              ]}
              onPress={() => setSplitMode(mode.key)}
            >
              <Text style={s.modeEmoji}>{mode.emoji}</Text>
              <Text
                style={[
                  s.modeLabel,
                  splitMode === mode.key && s.modeLabelActive,
                ]}
              >
                {mode.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[s.createButton, loading && s.createButtonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={s.createButtonText}>{t('create.createButton')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    sectionTitle: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.sm,
      marginTop: spacing.lg,
    },
    amountInput: {
      fontSize: fontSize.xxl,
      fontWeight: 'bold',
      color: colors.text,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      textAlign: 'center',
    },
    input: {
      fontSize: fontSize.md,
      color: colors.text,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    modeContainer: {
      flexDirection: 'row',
    },
    modeButton: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginHorizontal: spacing.xs,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.surfaceBorder,
    },
    modeButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.background,
    },
    modeEmoji: {
      fontSize: 28,
      marginBottom: spacing.xs,
    },
    modeLabel: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    modeLabelActive: {
      color: colors.primary,
      fontWeight: '600',
    },
    currencyContainer: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    currencyButton: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.surfaceBorder,
    },
    currencyButtonActive: {
      borderColor: colors.accent,
      backgroundColor: colors.background,
    },
    currencyLabel: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    currencyLabelActive: {
      color: colors.accent,
    },
    createButton: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      marginTop: spacing.xl,
    },
    createButtonDisabled: {
      opacity: 0.6,
    },
    createButtonText: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: colors.background,
    },
  });
