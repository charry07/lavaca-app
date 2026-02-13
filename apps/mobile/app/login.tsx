import { useState, useRef } from 'react';
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

// ── Phone Step ──────────────────────────────────────────
function PhoneStep() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { sendOTP } = useAuth();
  const s = createStyles(colors);

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    const cleanPhone = phone.replace(/\s/g, '').trim();
    if (!cleanPhone || cleanPhone.length < 7) {
      Alert.alert(t('common.error'), t('auth.invalidPhone'));
      return;
    }

    setLoading(true);
    try {
      await sendOTP(cleanPhone);
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || t('auth.errorSendingOTP'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Text style={s.title}>{t('auth.welcome')}</Text>
      <Text style={s.subtitle}>{t('auth.phoneSubtitle')}</Text>

      <Text style={s.fieldLabel}>{t('auth.phoneLabel')}</Text>
      <TextInput
        style={s.input}
        placeholder={t('auth.phonePlaceholder')}
        placeholderTextColor={colors.textMuted}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        autoFocus
      />

      <TouchableOpacity
        style={[s.button, loading && s.buttonDisabled]}
        onPress={handleSendOTP}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <Text style={s.buttonText}>{t('auth.sendCode')}</Text>
        )}
      </TouchableOpacity>

      <Text style={s.hint}>{t('auth.hint')}</Text>
    </>
  );
}

// ── OTP Step ────────────────────────────────────────────
function OTPStep() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { verifyOTP, pendingPhone, devCode, resetAuth } = useAuth();
  const s = createStyles(colors);

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    // Handle paste — distribute digits
    if (text.length > 1) {
      const digits = text.replace(/\D/g, '').split('').slice(0, 6);
      digits.forEach((d, i) => {
        if (i < 6) newCode[i] = d;
      });
      setCode(newCode);
      const nextEmpty = digits.length < 6 ? digits.length : 5;
      inputRefs.current[nextEmpty]?.focus();
      // Auto-submit if all 6 digits filled
      if (digits.length === 6) {
        handleVerify(newCode.join(''));
      }
      return;
    }

    newCode[index] = text;
    setCode(newCode);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit on last digit
    if (text && index === 5) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (fullCode?: string) => {
    const verifyCode = fullCode || code.join('');
    if (verifyCode.length !== 6) {
      Alert.alert(t('common.error'), t('auth.invalidOTP'));
      return;
    }

    setLoading(true);
    try {
      await verifyOTP(verifyCode);
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || t('auth.errorVerifyingOTP'));
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Text style={s.title}>{t('auth.verifyTitle')}</Text>
      <Text style={s.subtitle}>
        {t('auth.verifySubtitle', { phone: pendingPhone || '' })}
      </Text>

      {devCode && (
        <View style={[s.devBanner, { backgroundColor: colors.accent + '22' }]}>
          <Text style={[s.devBannerText, { color: colors.accent }]}>
            🔧 Dev code: {devCode}
          </Text>
        </View>
      )}

      <View style={s.otpContainer}>
        {code.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => { inputRefs.current[index] = ref; }}
            style={[s.otpInput, digit ? s.otpInputFilled : null]}
            keyboardType="number-pad"
            maxLength={index === 0 ? 6 : 1}
            value={digit}
            onChangeText={(text) => handleCodeChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            autoFocus={index === 0}
          />
        ))}
      </View>

      <TouchableOpacity
        style={[s.button, loading && s.buttonDisabled]}
        onPress={() => handleVerify()}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <Text style={s.buttonText}>{t('auth.verifyButton')}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={resetAuth} style={s.linkButton}>
        <Text style={s.linkText}>{t('auth.changePhone')}</Text>
      </TouchableOpacity>
    </>
  );
}

// ── Register Step ───────────────────────────────────────
function RegisterStep() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { register, pendingPhone, resetAuth } = useAuth();
  const s = createStyles(colors);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('auth.noName'));
      return;
    }
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9._]/g, '');
    if (!cleanUsername || cleanUsername.length < 3) {
      Alert.alert(t('common.error'), t('auth.invalidUsername'));
      return;
    }
    if (!documentId.trim()) {
      Alert.alert(t('common.error'), t('auth.noDocument'));
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), cleanUsername, documentId.trim());
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || t('auth.errorRegistering'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Text style={s.title}>{t('auth.registerTitle')}</Text>
      <Text style={s.subtitle}>
        {t('auth.registerSubtitle', { phone: pendingPhone || '' })}
      </Text>

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
          <Text style={s.buttonText}>{t('auth.registerButton')}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={resetAuth} style={s.linkButton}>
        <Text style={s.linkText}>{t('auth.changePhone')}</Text>
      </TouchableOpacity>
    </>
  );
}

// ── Main Login Screen ───────────────────────────────────
export default function LoginScreen() {
  const { colors } = useTheme();
  const { authStep } = useAuth();
  const s = createStyles(colors);

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

        {authStep === 'phone' && <PhoneStep />}
        {authStep === 'otp' && <OTPStep />}
        {authStep === 'register' && <RegisterStep />}
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
    // OTP styles
    otpContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    otpInput: {
      width: 48,
      height: 56,
      borderRadius: borderRadius.md,
      borderWidth: 2,
      borderColor: colors.surfaceBorder,
      backgroundColor: colors.surface,
      textAlign: 'center',
      fontSize: fontSize.xl,
      fontWeight: '700',
      color: colors.text,
      marginHorizontal: 4,
    },
    otpInputFilled: {
      borderColor: colors.primary,
    },
    devBanner: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
      marginBottom: spacing.lg,
      width: '100%',
      alignItems: 'center',
    },
    devBannerText: {
      fontSize: fontSize.sm,
      fontWeight: '600',
    },
    linkButton: {
      marginTop: spacing.md,
      paddingVertical: spacing.sm,
    },
    linkText: {
      fontSize: fontSize.sm,
      color: colors.primary,
      textDecorationLine: 'underline',
    },
  });
