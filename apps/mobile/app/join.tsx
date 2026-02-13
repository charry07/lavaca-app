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
import { spacing, borderRadius, fontSize, type ThemeColors } from '../src/constants/theme';
import { useI18n } from '../src/i18n';
import { useTheme } from '../src/theme';
import { useAuth } from '../src/auth';

export default function JoinScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useTheme();
  const { user } = useAuth();
  const s = createStyles(colors);
  const [code, setCode] = useState('');
  const [name, setName] = useState(user?.displayName || '');
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
        userId: user?.id || 'anonymous',
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
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={s.content}>
        <Text style={s.emoji}>🔗</Text>
        <Text style={s.title}>{t('join.title')}</Text>
        <Text style={s.subtitle}>
          {t('join.subtitle')}
        </Text>

        <TextInput
          style={s.codeInput}
          placeholder="VACA-XXXX"
          placeholderTextColor={colors.textMuted}
          value={code}
          onChangeText={(text) => setCode(text.toUpperCase())}
          autoCapitalize="characters"
          autoFocus
          maxLength={9}
        />

        <TextInput
          style={s.nameInput}
          placeholder={t('join.yourName')}
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
        />

        <TouchableOpacity
          style={[s.joinButton, loading && s.joinButtonDisabled]}
          onPress={handleJoin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={s.joinButtonText}>{t('join.joinButton')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
