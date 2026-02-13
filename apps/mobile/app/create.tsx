import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SplitMode } from '@lavaca/shared';
import { api } from '../src/services/api';
import { colors, spacing, borderRadius, fontSize } from '../src/constants/theme';

const SPLIT_MODES: { key: SplitMode; label: string; emoji: string }[] = [
  { key: 'equal', label: 'Partes iguales', emoji: '⚖️' },
  { key: 'percentage', label: 'Porcentajes', emoji: '📊' },
  { key: 'roulette', label: 'Ruleta', emoji: '🎰' },
];

export default function CreateScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    const numAmount = Number(amount.replace(/[^0-9]/g, ''));
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Error', 'Ingresa un monto valido');
      return;
    }

    setLoading(true);
    try {
      // TODO: Replace with real user ID from auth
      const session = await api.createSession({
        adminId: 'temp-user-' + Date.now(),
        totalAmount: numAmount,
        splitMode,
        description: description || undefined,
      });

      router.replace(`/session/${session.joinCode}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo crear la mesa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Monto total</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="$0"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          autoFocus
        />

        <Text style={styles.sectionTitle}>Descripcion (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Almuerzo con los parceros"
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.sectionTitle}>Como dividimos?</Text>
        <View style={styles.modeContainer}>
          {SPLIT_MODES.map((mode) => (
            <TouchableOpacity
              key={mode.key}
              style={[
                styles.modeButton,
                splitMode === mode.key && styles.modeButtonActive,
              ]}
              onPress={() => setSplitMode(mode.key)}
            >
              <Text style={styles.modeEmoji}>{mode.emoji}</Text>
              <Text
                style={[
                  styles.modeLabel,
                  splitMode === mode.key && styles.modeLabelActive,
                ]}
              >
                {mode.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.createButtonText}>Crear Mesa 🐄</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
    gap: spacing.sm,
  },
  modeButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
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
