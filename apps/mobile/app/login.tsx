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
  const [username, setUsername] = useState('');
  const [documentId, setDocumentId] = useState('');
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
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9._]/g, '');
    if (!cleanUsername || cleanUsername.length < 3) {
      Alert.alert(t('common.error'), t('auth.invalidUsername'));
      return;
    }

    setLoading(true);
    try {
      await register(cleanPhone, name.trim(), cleanUsername, documentId.trim() || undefined);
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
      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        <VacaLogo size="lg" />

        <Text style={s.title}>{t('auth.welcome')}</Text>
        <Text style={s.subtitle}>{t('auth.subtitle')}</Text>

        <Text style={s.fieldLabel}>{t('auth.nameLabel')}</Text>
        <TextInput
          style={s.input}
          placeholder={t('auth.namePlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <Text style={s.fieldLabel}>{t('auth.usernameLabel')}</Text>
        <TextInput
          style={s.input}
          placeholder={t('auth.usernamePlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={username}
          onChangeText={(text) => setUsername(text.toLowerCase().replace(/\s/g, ''))}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={s.fieldLabel}>{t('auth.phoneLabel')}</Text>
        <TextInput
          style={s.input}
          placeholder={t('auth.phonePlaceholder')}
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <Text style={s.fieldLabel}>{t('auth.documentLabel')}</Text>
        <TextInput
          style={s.input}
          placeholder={t('auth.documentPlaceholder')}
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          value={documentId}
          onChangeText={setDocumentId}
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
    content: {
      flexGrow: 1,
      padding: spacing.lg,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: spacing.xxl,
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
    fieldLabel: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.textSecondary,
      alignSelf: 'flex-start',
      marginBottom: spacing.xs,
      marginTop: spacing.sm,
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
      marginBottom: spacing.sm,
    },
    button: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xxl,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      width: '100%',
      marginTop: spacing.md,
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
