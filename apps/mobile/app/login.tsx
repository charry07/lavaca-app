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
import { spacing, borderRadius, fontSize, type ThemeColors } from '../src/constants/theme';
import { useI18n } from '../src/i18n';
import { useTheme } from '../src/theme';
import { useAuth } from '../src/auth';
import { VacaLogo } from '../src/components/VacaLogo';
import { HeaderControls } from '../src/components/HeaderControls';

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
  const [country, setCountry] = useState<Country>(COUNTRIES[0]); // Default: Colombia 🇨🇴
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
        {/* Country code selector */}
        <TouchableOpacity
          style={s.countryButton}
          onPress={() => setShowPicker(true)}
          activeOpacity={0.7}
        >
          <Text style={s.countryFlag}>{country.flag}</Text>
          <Text style={s.countryDial}>{country.dial}</Text>
          <Text style={s.countryArrow}>▼</Text>
        </TouchableOpacity>

        {/* Phone input */}
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
        {loading ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <Text style={s.buttonText}>{t('auth.sendCode')}</Text>
        )}
      </TouchableOpacity>

      <Text style={s.hint}>{t('auth.hint')}</Text>
      <Text style={s.hintDev}>{t('auth.hintDev')}</Text>

      {/* Country picker modal */}
      <Modal visible={showPicker} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContainer}>
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
  const { verifyOTP, pendingPhone, devCode, resetAuth } = useAuth();
  const s = createStyles(colors);

  const MAX_ATTEMPTS = 3;
  const BLOCK_SECONDS = 60;

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [blockedSecsLeft, setBlockedSecsLeft] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
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
      // success — AuthContext handles navigation
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
        {loading ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <Text style={s.buttonText}>{t('auth.verifyButton')}</Text>
        )}
      </TouchableOpacity>

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
        <View style={s.headerControls}>
          <HeaderControls />
        </View>

        <VacaLogo size="lg" style={{ marginTop: spacing.xxl }} />

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
    headerControls: {
      position: 'absolute',
      top: spacing.xl,
      right: 0,
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
    hintDev: {
      fontSize: fontSize.xs,
      color: colors.accent,
      textAlign: 'center',
      marginTop: spacing.xs,
      fontStyle: 'italic',
    },
    // Phone row with country picker
    phoneRow: {
      flexDirection: 'row',
      width: '100%',
      marginBottom: spacing.sm,
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
      marginRight: spacing.xs,
    },
    countryFlag: {
      fontSize: 22,
      marginRight: 4,
    },
    countryDial: {
      fontSize: fontSize.md,
      color: colors.text,
      fontWeight: '600',
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
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    // Country picker modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: colors.background,
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
      fontWeight: '700',
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
      backgroundColor: colors.surface,
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
      fontWeight: '600',
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
      fontWeight: '600',
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
