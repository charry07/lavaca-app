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
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../src/services/api';
import { colors, spacing, borderRadius, fontSize } from '../src/constants/theme';

export default function JoinScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    const joinCode = code.toUpperCase().trim();
    if (!joinCode) {
      Alert.alert('Error', 'Ingresa el codigo de la mesa');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Error', 'Ingresa tu nombre');
      return;
    }

    setLoading(true);
    try {
      // First check if session exists
      await api.getSession(joinCode);

      // Then join
      await api.joinSession(joinCode, {
        userId: 'temp-user-' + Date.now(),
        displayName: name.trim(),
      });

      router.replace(`/session/${joinCode}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo unir a la mesa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.emoji}>🔗</Text>
        <Text style={styles.title}>Unirme a una mesa</Text>
        <Text style={styles.subtitle}>
          Ingresa el codigo que te compartieron
        </Text>

        <TextInput
          style={styles.codeInput}
          placeholder="VACA-XXXX"
          placeholderTextColor={colors.textMuted}
          value={code}
          onChangeText={(text) => setCode(text.toUpperCase())}
          autoCapitalize="characters"
          autoFocus
          maxLength={9}
        />

        <TextInput
          style={styles.nameInput}
          placeholder="Tu nombre"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
        />

        <TouchableOpacity
          style={[styles.joinButton, loading && styles.joinButtonDisabled]}
          onPress={handleJoin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.joinButtonText}>Unirme 🐄</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 56,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  codeInput: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    textAlign: 'center',
    width: '100%',
    marginBottom: spacing.md,
    letterSpacing: 4,
  },
  nameInput: {
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    textAlign: 'center',
    width: '100%',
    marginBottom: spacing.lg,
  },
  joinButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    width: '100%',
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.background,
  },
});
