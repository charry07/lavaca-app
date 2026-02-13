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
import { spacing, borderRadius, fontSize, type ThemeColors } from '../src/constants/theme';
import { useI18n } from '../src/i18n';
import { useTheme } from '../src/theme';
import { useAuth } from '../src/auth';
import { VacaLogo } from '../src/components/VacaLogo';

export default function LoginScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { register } = useAuth();
  const s = createStyles(colors);

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const cleanPhone = phone.replace(/\s/g, '').trim();
    if (!cleanPhone || cleanPhone.length < 7) {
      Alert.alert(t('common.error'), t('auth.invalidPhone'));
      return;
    }
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('auth.noName'));
      return;
    }

    setLoading(true);
    try {
      await register(cleanPhone, name.trim());
      // Navigation is automatic — root layout will redirect
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || t('auth.errorRegistering'));
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
        <VacaLogo size="lg" />

        <Text style={s.title}>{t('auth.welcome')}</Text>
        <Text style={s.subtitle}>{t('auth.subtitle')}</Text>

        <TextInput
          style={s.input}
          placeholder={t('auth.phonePlaceholder')}
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          autoFocus
        />

        <TextInput
          style={s.input}
          placeholder={t('auth.namePlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
        />

        <TouchableOpacity
          style={[s.button, loading && s.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={s.buttonText}>{t('auth.enterButton')}</Text>
          )}
        </TouchableOpacity>

        <Text style={s.hint}>{t('auth.hint')}</Text>
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
    title: {
      fontSize: fontSize.xl,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: spacing.lg,
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.xl,
    },
    input: {
      fontSize: fontSize.md,
      color: colors.text,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      width: '100%',
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    button: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xxl,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      width: '100%',
      marginTop: spacing.sm,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: colors.background,
    },
    hint: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: spacing.lg,
    },
  });
