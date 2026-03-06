import { useState, useRef, useEffect } from 'react';
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
  Modal,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, borderRadius, fontSize, fontWeight, type ThemeColors } from '../src/constants/theme';
import { useI18n } from '../src/i18n';
import { useTheme } from '../src/theme';
import { useAuth } from '../src/auth';
import { VacaLogo, HeaderControls } from '../src/components';

import { getErrorMessage } from '../src/utils/errorMessage';
// ── Country data ────────────────────────────────────────
interface Country {
  flag: string;
  name: string;
  dial: string;
}

const COUNTRIES: Country[] = [
  { flag: '🇨🇴', name: 'Colombia', dial: '+57' },
  { flag: '🇲🇽', name: 'México', dial: '+52' },
  { flag: '🇦🇷', name: 'Argentina', dial: '+54' },
  { flag: '🇨🇱', name: 'Chile', dial: '+56' },
  { flag: '🇵🇪', name: 'Perú', dial: '+51' },
  { flag: '🇪🇨', name: 'Ecuador', dial: '+593' },
  { flag: '🇻🇪', name: 'Venezuela', dial: '+58' },
  { flag: '🇧🇷', name: 'Brasil', dial: '+55' },
  { flag: '🇧🇴', name: 'Bolivia', dial: '+591' },
  { flag: '🇵🇾', name: 'Paraguay', dial: '+595' },
  { flag: '🇺🇾', name: 'Uruguay', dial: '+598' },
  { flag: '🇵🇦', name: 'Panamá', dial: '+507' },
  { flag: '🇨🇷', name: 'Costa Rica', dial: '+506' },
  { flag: '🇬🇹', name: 'Guatemala', dial: '+502' },
  { flag: '🇭🇳', name: 'Honduras', dial: '+504' },
  { flag: '🇸🇻', name: 'El Salvador', dial: '+503' },
  { flag: '🇳🇮', name: 'Nicaragua', dial: '+505' },
  { flag: '🇩🇴', name: 'Rep. Dominicana', dial: '+1' },
  { flag: '🇨🇺', name: 'Cuba', dial: '+53' },
  { flag: '🇺🇸', name: 'Estados Unidos', dial: '+1' },
  { flag: '🇪🇸', name: 'España', dial: '+34' },
];

// ── Phone Step ──────────────────────────────────────────
function PhoneStep() {
  const { translate } = useI18n();
  const { colors } = useTheme();
  const { sendOTP } = useAuth();
  const styles = createStyles(colors);

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');

  const filteredCountries = search.trim()
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dial.includes(search)
      )
    : COUNTRIES;

  const handleSendOTP = async () => {
    const cleanPhone = phone.replace(/\s/g, '').replace(/^0+/, '').trim();
    if (!cleanPhone || cleanPhone.length < 7) {
      Alert.alert(translate('common.error'), translate('auth.invalidPhone'));
      return;
    }

    const fullPhone = `${country.dial}${cleanPhone}`;

    setLoading(true);
    try {
      await sendOTP(fullPhone);
    } catch (err: unknown) {
      Alert.alert(translate('common.error'), getErrorMessage(err, translate('auth.errorSendingOTP')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Text style={styles.title}>{translate('auth.welcome')}</Text>
      <Text style={styles.subtitle}>{translate('auth.phoneSubtitle')}</Text>

      <Text style={styles.fieldLabel}>{translate('auth.phoneLabel')}</Text>

      <View style={styles.phoneRow}>
        <TouchableOpacity
          style={styles.countryButton}
          onPress={() => setShowPicker(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.countryFlag}>{country.flag}</Text>
          <Text style={styles.countryDial}>{country.dial}</Text>
          <Text style={styles.countryArrow}>▾</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.phoneInput}
          placeholder={translate('auth.phonePlaceholder')}
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          autoFocus
        />
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSendOTP}
        disabled={loading}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.buttonText}>{translate('auth.sendCode')}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <Text style={styles.hint}>{translate('auth.hint')}</Text>
      <Text style={styles.hintDev}>{translate('auth.hintDev')}</Text>

      {/* Country picker modal */}
      <Modal visible={showPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{translate('auth.selectCountry')}</Text>
              <TouchableOpacity onPress={() => { setShowPicker(false); setSearch(''); }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalSearch}
              placeholder={translate('auth.searchCountry')}
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoFocus
            />

            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => `${item.flag}-${item.dial}-${item.name}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    item.name === country.name && item.dial === country.dial && styles.countryItemSelected,
                  ]}
                  onPress={() => {
                    setCountry(item);
                    setShowPicker(false);
                    setSearch('');
                  }}
                >
                  <Text style={styles.countryItemFlag}>{item.flag}</Text>
                  <Text style={styles.countryItemName}>{item.name}</Text>
                  <Text style={styles.countryItemDial}>{item.dial}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

// ── OTP Step ────────────────────────────────────────────
function OTPStep() {
  const { translate } = useI18n();
  const { colors } = useTheme();
  const { verifyOTP, resendOTP, pendingPhone, devCode, resetAuth } = useAuth();
  const styles = createStyles(colors);

  const MAX_ATTEMPTS = 3;
  const BLOCK_SECONDS = 60;
  const RESEND_COOLDOWN = 60;

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [blockedSecsLeft, setBlockedSecsLeft] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    resendTimerRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(resendTimerRef.current!);
          resendTimerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    };
  }, []);

  const startBlockCountdown = () => {
    setBlockedSecsLeft(BLOCK_SECONDS);
    countdownRef.current = setInterval(() => {
      setBlockedSecsLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          countdownRef.current = null;
          resetAuth();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    try {
      await resendOTP();
      setResendCooldown(RESEND_COOLDOWN);
      resendTimerRef.current = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(resendTimerRef.current!);
            resendTimerRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setCode(['', '', '', '', '', '']);
      setErrorMsg('');
      setAttempts(0);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      Alert.alert(translate('common.error'), getErrorMessage(err, translate('auth.errorSendingOTP')));
    } finally {
      setResending(false);
    }
  };

  const handleCodeChange = (text: string, index: number) => {
    if (blockedSecsLeft > 0) return;
    const newCode = [...code];
    if (text.length > 1) {
      const digits = text.replace(/\D/g, '').split('').slice(0, 6);
      digits.forEach((d, i) => { if (i < 6) newCode[i] = d; });
      setCode(newCode);
      const nextEmpty = digits.length < 6 ? digits.length : 5;
      inputRefs.current[nextEmpty]?.focus();
      if (digits.length === 6) handleVerify(newCode.join(''));
      return;
    }
    newCode[index] = text;
    setCode(newCode);
    if (text && index < 5) inputRefs.current[index + 1]?.focus();
    if (text && index === 5) handleVerify(newCode.join(''));
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (fullCode?: string) => {
    const verifyCode = fullCode || code.join('');
    if (verifyCode.length !== 6) {
      setErrorMsg(translate('auth.invalidOTP'));
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await verifyOTP(verifyCode);
    } catch {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();

      if (newAttempts >= MAX_ATTEMPTS) {
        setErrorMsg(translate('auth.tooManyAttempts') + ' ' + translate('auth.blockedFor', { s: String(BLOCK_SECONDS) }));
        startBlockCountdown();
      } else {
        const left = MAX_ATTEMPTS - newAttempts;
        setErrorMsg(translate('auth.wrongCode') + '\n' + translate('auth.attemptsLeft', { n: String(left) }));
      }
    } finally {
      setLoading(false);
    }
  };

  const isBlocked = blockedSecsLeft > 0;

  return (
    <>
      <Text style={styles.title}>{translate('auth.verifyTitle')}</Text>
      <Text style={styles.subtitle}>
        {translate('auth.verifySubtitle', { phone: pendingPhone || '' })}
      </Text>

      {devCode && (
        <View style={styles.devBanner}>
          <Text style={styles.devBannerText}>🔧 Dev code: <Text style={{ color: colors.accent, fontWeight: fontWeight.bold }}>{devCode}</Text></Text>
        </View>
      )}

      <View style={styles.otpContainer}>
        {code.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => { inputRefs.current[index] = ref; }}
            style={[
              styles.otpInput,
              digit ? styles.otpInputFilled : null,
              errorMsg ? styles.otpInputError : null,
              isBlocked ? styles.otpInputBlocked : null,
            ]}
            keyboardType="number-pad"
            maxLength={index === 0 ? 6 : 1}
            value={digit}
            onChangeText={(text) => handleCodeChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            autoFocus={index === 0}
            editable={!isBlocked && !loading}
          />
        ))}
      </View>

      {errorMsg ? (
        <View style={[styles.errorBanner, isBlocked && { borderColor: colors.warning }]}>
          <Text style={[styles.errorText, isBlocked && { color: colors.warning }]}>
            {isBlocked
              ? translate('auth.tooManyAttempts') + '\n' + translate('auth.blockedFor', { s: String(blockedSecsLeft) })
              : errorMsg}
          </Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.button, (loading || isBlocked) && styles.buttonDisabled]}
        onPress={() => handleVerify()}
        disabled={loading || isBlocked}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.buttonText}>{translate('auth.verifyButton')}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.resendRow}>
        {resendCooldown > 0 ? (
          <Text style={styles.resendCooldown}>
            {translate('auth.resendIn', { s: String(resendCooldown) })}
          </Text>
        ) : (
          <TouchableOpacity onPress={handleResend} disabled={resending}>
            {resending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.resendLink}>{translate('auth.resendCode')}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity onPress={resetAuth} style={styles.linkButton} disabled={isBlocked}>
        <Text style={[styles.linkText, isBlocked && { color: colors.textMuted }]}>{translate('auth.changePhone')}</Text>
      </TouchableOpacity>
    </>
  );
}

// ── Register Step ───────────────────────────────────────
function RegisterStep() {
  const { translate } = useI18n();
  const { colors } = useTheme();
  const { register, pendingPhone, resetAuth } = useAuth();
  const styles = createStyles(colors);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert(translate('common.error'), translate('auth.noName'));
      return;
    }
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9._]/g, '');
    if (!cleanUsername || cleanUsername.length < 3) {
      Alert.alert(translate('common.error'), translate('auth.invalidUsername'));
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), cleanUsername, documentId.trim());
    } catch (err: unknown) {
      Alert.alert(translate('common.error'), getErrorMessage(err, translate('auth.errorRegistering')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Text style={styles.title}>{translate('auth.registerTitle')}</Text>
      <Text style={styles.subtitle}>
        {translate('auth.registerSubtitle', { phone: pendingPhone || '' })}
      </Text>

      <View style={styles.labelRow}>
        <Text style={styles.fieldLabel}>{translate('auth.nameLabel')}</Text>
        <Text style={styles.required}>*</Text>
      </View>
      <TextInput
        style={styles.input}
        placeholder={translate('auth.namePlaceholder')}
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
        autoFocus
      />

      <View style={styles.labelRow}>
        <Text style={styles.fieldLabel}>{translate('auth.usernameLabel')}</Text>
        <Text style={styles.required}>*</Text>
      </View>
      <TextInput
        style={styles.input}
        placeholder={translate('auth.usernamePlaceholder')}
        placeholderTextColor={colors.textMuted}
        value={username}
        onChangeText={(text) => setUsername(text.toLowerCase().replace(/\s/g, ''))}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={styles.labelRow}>
        <Text style={styles.fieldLabel}>{translate('auth.documentLabel')}</Text>
        <Text style={styles.optional}>{translate('common.optional')}</Text>
      </View>
      <TextInput
        style={styles.input}
        placeholder={translate('auth.documentPlaceholder')}
        placeholderTextColor={colors.textMuted}
        keyboardType="numeric"
        value={documentId}
        onChangeText={setDocumentId}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.buttonText}>{translate('auth.registerButton')}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity onPress={resetAuth} style={styles.linkButton}>
        <Text style={styles.linkText}>{translate('auth.changePhone')}</Text>
      </TouchableOpacity>
    </>
  );
}

// ── Main Login Screen ───────────────────────────────────
export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const { authStep } = useAuth();
  const styles = createStyles(colors);

  // Warm espresso gradient — like the inside of a café at night
  const gradientColors: [string, string, string] = isDark
    ? ['#0c0a06', '#131008', '#1a1510']
    : ['#fdf8f0', '#f5ede0', '#eee0cb'];

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerControls}>
            <HeaderControls />
          </View>

          <VacaLogo size="lg" style={{ marginTop: spacing.xxl }} />

          {/* Form card — warm surface with golden border */}
          <View style={[styles.card, { backgroundColor: colors.surface2, borderColor: colors.surfaceBorder }]}>
            <View style={styles.cardInner}>
              {authStep === 'phone' && <PhoneStep />}
              {authStep === 'otp' && <OTPStep />}
              {authStep === 'register' && <RegisterStep />}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    container: { flex: 1 },
    content: {
      flexGrow: 1,
      padding: spacing.lg,
      alignItems: 'center',
      paddingBottom: spacing.xxl,
    },
    headerControls: {
      position: 'absolute',
      top: spacing.xl,
      right: 0,
    },
    card: {
      width: '100%',
      marginTop: spacing.xl,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      overflow: 'hidden',
    },
    cardInner: {
      padding: spacing.lg,
      alignItems: 'center',
    },
    title: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: colors.text,
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.xl,
      lineHeight: 20,
    },
    fieldLabel: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      color: colors.textMuted,
      alignSelf: 'flex-start',
      marginBottom: spacing.xs,
      marginTop: spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
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
      width: '100%',
      borderRadius: borderRadius.md,
      overflow: 'hidden',
      marginTop: spacing.md,
    },
    buttonDisabled: { opacity: 0.55 },
    buttonGradient: {
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.xxl,
      alignItems: 'center',
    },
    buttonText: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.bold,
      color: colors.background,
      letterSpacing: 0.3,
    },
    hint: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: spacing.lg,
      lineHeight: 18,
    },
    hintDev: {
      fontSize: fontSize.xs,
      color: colors.accent,
      textAlign: 'center',
      marginTop: spacing.xs,
      fontStyle: 'italic',
    },
    phoneRow: {
      flexDirection: 'row',
      width: '100%',
      marginBottom: spacing.sm,
      gap: spacing.xs,
    },
    countryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.md,
      gap: 4,
    },
    countryFlag: { fontSize: 20 },
    countryDial: {
      fontSize: fontSize.md,
      color: colors.text,
      fontWeight: fontWeight.semibold,
    },
    countryArrow: {
      fontSize: 11,
      color: colors.textMuted,
    },
    phoneInput: {
      flex: 1,
      fontSize: fontSize.md,
      color: colors.text,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    // Country picker modal
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    modalContainer: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '70%',
      paddingBottom: spacing.xxl,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.surfaceBorder,
    },
    modalTitle: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: colors.text,
    },
    modalClose: {
      fontSize: fontSize.lg,
      color: colors.textMuted,
      padding: spacing.xs,
    },
    modalSearch: {
      fontSize: fontSize.md,
      color: colors.text,
      backgroundColor: colors.surface2,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      margin: spacing.md,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    countryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.surfaceBorder,
    },
    countryItemSelected: {
      backgroundColor: colors.primary + '12',
    },
    countryItemFlag: { fontSize: 22, marginRight: spacing.md },
    countryItemName: {
      flex: 1,
      fontSize: fontSize.md,
      color: colors.text,
    },
    countryItemDial: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      fontWeight: fontWeight.semibold,
    },
    // OTP styles
    otpContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: spacing.lg,
      gap: 8,
    },
    otpInput: {
      width: 46,
      height: 54,
      borderRadius: borderRadius.md,
      borderWidth: 2,
      borderColor: colors.surfaceBorder,
      backgroundColor: colors.surface,
      textAlign: 'center',
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: colors.text,
    },
    otpInputFilled: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    otpInputError: {
      borderColor: colors.danger,
      backgroundColor: colors.danger + '0d',
    },
    otpInputBlocked: {
      borderColor: colors.warning,
      opacity: 0.55,
    },
    errorBanner: {
      backgroundColor: colors.danger + '18',
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.danger + '40',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.md,
      width: '100%',
      alignItems: 'center',
    },
    errorText: {
      color: colors.danger,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      textAlign: 'center',
    },
    devBanner: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
      marginBottom: spacing.lg,
      width: '100%',
      alignItems: 'center',
      backgroundColor: colors.accent + '14',
      borderWidth: 1,
      borderColor: colors.accent + '30',
    },
    devBannerText: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    resendRow: {
      marginTop: spacing.sm,
      alignItems: 'center',
      minHeight: 28,
    },
    resendCooldown: {
      fontSize: fontSize.xs,
      textAlign: 'center',
      color: colors.textMuted,
    },
    resendLink: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: colors.primary,
      textDecorationLine: 'underline',
    },
    linkButton: {
      marginTop: spacing.md,
      paddingVertical: spacing.sm,
    },
    linkText: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textDecorationLine: 'underline',
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      width: '100%',
      gap: 4,
    },
    required: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.bold,
      color: colors.danger,
    },
    optional: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      fontStyle: 'italic',
    },
  });
