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
import { VacaLogo } from '../src/components/VacaLogo';
import { HeaderControls } from '../src/components/HeaderControls';
import { GlassCard } from '../src/components/GlassCard';

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
  const { t } = useI18n();
  const { colors } = useTheme();
  const { sendOTP } = useAuth();
  const s = createStyles(colors);

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
      Alert.alert(t('common.error'), t('auth.invalidPhone'));
      return;
    }

    const fullPhone = `${country.dial}${cleanPhone}`;

    setLoading(true);
    try {
      await sendOTP(fullPhone);
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

      <View style={s.phoneRow}>
        <TouchableOpacity
          style={s.countryButton}
          onPress={() => setShowPicker(true)}
          activeOpacity={0.7}
        >
          <Text style={s.countryFlag}>{country.flag}</Text>
          <Text style={s.countryDial}>{country.dial}</Text>
          <Text style={s.countryArrow}>▼</Text>
        </TouchableOpacity>

        <TextInput
          style={s.phoneInput}
          placeholder={t('auth.phonePlaceholder')}
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          autoFocus
        />
      </View>

      <TouchableOpacity
        style={[s.button, loading && s.buttonDisabled]}
        onPress={handleSendOTP}
        disabled={loading}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.buttonGradient}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={s.buttonText}>{t('auth.sendCode')}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <Text style={s.hint}>{t('auth.hint')}</Text>
      <Text style={s.hintDev}>{t('auth.hintDev')}</Text>

      {/* Country picker modal */}
      <Modal visible={showPicker} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.modalContainer, { backgroundColor: colors.background }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{t('auth.selectCountry')}</Text>
              <TouchableOpacity onPress={() => { setShowPicker(false); setSearch(''); }}>
                <Text style={s.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={s.modalSearch}
              placeholder={t('auth.searchCountry')}
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
                    s.countryItem,
                    item.name === country.name && item.dial === country.dial && s.countryItemSelected,
                  ]}
                  onPress={() => {
                    setCountry(item);
                    setShowPicker(false);
                    setSearch('');
                  }}
                >
                  <Text style={s.countryItemFlag}>{item.flag}</Text>
                  <Text style={s.countryItemName}>{item.name}</Text>
                  <Text style={s.countryItemDial}>{item.dial}</Text>
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
  const { t } = useI18n();
  const { colors } = useTheme();
  const { verifyOTP, resendOTP, pendingPhone, devCode, resetAuth } = useAuth();
  const s = createStyles(colors);

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

  // Start resend cooldown on mount (code was just sent)
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
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || t('auth.errorSendingOTP'));
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
      setErrorMsg(t('auth.invalidOTP'));
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await verifyOTP(verifyCode);
    } catch (err: any) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();

      if (newAttempts >= MAX_ATTEMPTS) {
        setErrorMsg(t('auth.tooManyAttempts') + ' ' + t('auth.blockedFor', { s: String(BLOCK_SECONDS) }));
        startBlockCountdown();
      } else {
        const left = MAX_ATTEMPTS - newAttempts;
        setErrorMsg(t('auth.wrongCode') + '\n' + t('auth.attemptsLeft', { n: String(left) }));
      }
    } finally {
      setLoading(false);
    }
  };

  const isBlocked = blockedSecsLeft > 0;

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
            style={[
              s.otpInput,
              digit ? s.otpInputFilled : null,
              errorMsg ? s.otpInputError : null,
              isBlocked ? s.otpInputBlocked : null,
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

      {/* Error / blocked message */}
      {errorMsg ? (
        <View style={[s.errorBanner, isBlocked && { backgroundColor: colors.warning + '22' }]}>
          <Text style={[s.errorText, isBlocked && { color: colors.warning }]}>
            {isBlocked
              ? t('auth.tooManyAttempts') + '\n' + t('auth.blockedFor', { s: String(blockedSecsLeft) })
              : errorMsg}
          </Text>
          {isBlocked && (
            <Text style={[s.errorText, { color: colors.textMuted, fontSize: 12, marginTop: 4 }]}>
              {t('auth.blockedReturn')}
            </Text>
          )}
        </View>
      ) : null}

      <TouchableOpacity
        style={[s.button, (loading || isBlocked) && s.buttonDisabled]}
        onPress={() => handleVerify()}
        disabled={loading || isBlocked}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.buttonGradient}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={s.buttonText}>{t('auth.verifyButton')}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Resend code */}
      <View style={s.resendRow}>
        {resendCooldown > 0 ? (
          <Text style={[s.resendCooldown, { color: colors.textMuted }]}>
            {t('auth.resendIn', { s: String(resendCooldown) })}
          </Text>
        ) : (
          <TouchableOpacity onPress={handleResend} disabled={resending}>
            {resending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[s.resendLink, { color: colors.primary }]}>
                {t('auth.resendCode')}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity onPress={resetAuth} style={s.linkButton} disabled={isBlocked}>
        <Text style={[s.linkText, isBlocked && { color: colors.textMuted }]}>{t('auth.changePhone')}</Text>
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
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.buttonGradient}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={s.buttonText}>{t('auth.registerButton')}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity onPress={resetAuth} style={s.linkButton}>
        <Text style={s.linkText}>{t('auth.changePhone')}</Text>
      </TouchableOpacity>
    </>
  );
}

// ── Main Login Screen ───────────────────────────────────
export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const { authStep } = useAuth();
  const s = createStyles(colors);

  const gradientColors: [string, string, string] = isDark
    ? ['#0f0f23', '#1a1a2e', '#16213e']
    : ['#e8f4e8', '#f0f7f0', '#f8fafc'];

  return (
    <LinearGradient colors={gradientColors} style={s.container}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.headerControls}>
            <HeaderControls />
          </View>

          <VacaLogo size="lg" style={{ marginTop: spacing.xxl }} />

          {/* Form card */}
          <GlassCard style={s.card}>
            <View style={s.cardInner}>
              {authStep === 'phone' && <PhoneStep />}
              {authStep === 'otp' && <OTPStep />}
              {authStep === 'register' && <RegisterStep />}
            </View>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    container: {
      flex: 1,
    },
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
    },
    subtitle: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.xl,
    },
    fieldLabel: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: colors.textSecondary,
      alignSelf: 'flex-start',
      marginBottom: spacing.xs,
      marginTop: spacing.sm,
    },
    input: {
      fontSize: fontSize.md,
      color: colors.text,
      backgroundColor: colors.glass,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      width: '100%',
      marginBottom: spacing.sm,
    },
    button: {
      width: '100%',
      borderRadius: borderRadius.md,
      overflow: 'hidden',
      marginTop: spacing.md,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonGradient: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xxl,
      alignItems: 'center',
    },
    buttonText: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: colors.background,
    },
    hint: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: spacing.lg,
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
    },
    countryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.glass,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.md,
      marginRight: spacing.xs,
    },
    countryFlag: {
      fontSize: 22,
      marginRight: 4,
    },
    countryDial: {
      fontSize: fontSize.md,
      color: colors.text,
      fontWeight: fontWeight.semibold,
      marginRight: 4,
    },
    countryArrow: {
      fontSize: 10,
      color: colors.textMuted,
    },
    phoneInput: {
      flex: 1,
      fontSize: fontSize.md,
      color: colors.text,
      backgroundColor: colors.glass,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.glassBorder,
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
      borderBottomWidth: 1,
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
      backgroundColor: colors.glass,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      margin: spacing.md,
      borderWidth: 1,
      borderColor: colors.glassBorder,
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
      backgroundColor: colors.primary + '15',
    },
    countryItemFlag: {
      fontSize: 24,
      marginRight: spacing.md,
    },
    countryItemName: {
      flex: 1,
      fontSize: fontSize.md,
      color: colors.text,
    },
    countryItemDial: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
      fontWeight: fontWeight.semibold,
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
      borderColor: colors.glassBorder,
      backgroundColor: colors.glass,
      textAlign: 'center',
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: colors.text,
      marginHorizontal: 4,
    },
    otpInputFilled: {
      borderColor: colors.primary,
    },
    otpInputError: {
      borderColor: colors.danger,
      backgroundColor: colors.danger + '11',
    },
    otpInputBlocked: {
      borderColor: colors.warning,
      backgroundColor: colors.warning + '11',
      opacity: 0.6,
    },
    errorBanner: {
      backgroundColor: colors.danger + '22',
      borderRadius: borderRadius.md,
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
    },
    devBannerText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
    },
    resendRow: {
      marginTop: spacing.sm,
      alignItems: 'center',
      minHeight: 28,
    },
    resendCooldown: {
      fontSize: fontSize.xs,
      textAlign: 'center',
    },
    resendLink: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      textDecorationLine: 'underline',
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
