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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../src/services/api';
import { colors, spacing, borderRadius, fontSize } from '../src/constants/theme';
import { useI18n } from '../src/i18n';

export default function JoinScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    const joinCode = code.toUpperCase().trim();
    if (!joinCode) {
      Alert.alert(t('common.error'), t('join.noCode'));
      return;
    }
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('join.noName'));
      return;
    }

    setLoading(true);
    try {
      await api.getSession(joinCode);
      await api.joinSession(joinCode, {
        userId: 'temp-user-' + Date.now(),
        displayName: name.trim(),
      });

      router.replace(`/session/${joinCode}`);
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || t('join.errorJoining'));
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
        <Text style={styles.title}>{t('join.title')}</Text>
        <Text style={styles.subtitle}>
          {t('join.subtitle')}
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
          placeholder={t('join.yourName')}
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
            <Text style={styles.joinButtonText}>{t('join.joinButton')}</Text>
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
