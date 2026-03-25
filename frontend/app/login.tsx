import React, {useState, useRef, useEffect} from "react";
import {View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Modal, FlatList} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {spacing, borderRadius, fontSize, fontWeight, type ThemeColors} from "../src/constants/theme";
import {useI18n} from "../src/i18n";
import {useTheme} from "../src/theme";
import {useAuth} from "../src/auth";
import {VacaLogo, HeaderControls, useToast} from "../src/components";
import {getErrorMessage} from "../src/utils/errorMessage";
import {fetchCountries, getCountriesSync} from "../src/services/countries";
import type {Country} from "@lavaca/types";

// ── Weak PIN blacklist ───────────────────────────────────
const WEAK_PINS = new Set(["123456", "654321", "000000", "111111", "222222", "333333", "444444", "555555", "666666", "777777", "888888", "999999", "112233", "121212", "123123", "010101"]);

const isWeakPin = (pin: string) => WEAK_PINS.has(pin);

// ── Phone Step ──────────────────────────────────────────
function PhoneStep() {
  const {translate} = useI18n();
  const {colors} = useTheme();
  const {checkPhone} = useAuth();
  const {showError} = useToast();
  const styles = createStyles(colors);

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<Country[]>(getCountriesSync());
  const [country, setCountry] = useState<Country>(getCountriesSync()[0]);
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState("");

  // Fetch countries on mount
  useEffect(() => {
    fetchCountries().then(fetchedCountries => {
      setCountries(fetchedCountries);
      // Update selected country to match fetched data if possible
      setCountry(prevCountry => {
        const currentCode = prevCountry.code || prevCountry.dial;
        const updatedCountry = fetchedCountries.find(
          c => c.code === currentCode || c.dial === prevCountry.dial
        );
        return updatedCountry || prevCountry;
      });
    });
  }, []);

  const filteredCountries = search.trim() 
    ? countries.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.dial.includes(search)) 
    : countries;

  const handleContinue = async () => {
    const cleanPhone = phone.replace(/\s/g, "").replace(/^0+/, "").trim();
    if (!cleanPhone || cleanPhone.length < 7) {
      showError(translate("auth.invalidPhone"));
      return;
    }

    const fullPhone = `${country.dial}${cleanPhone}`;

    setLoading(true);
    try {
      await checkPhone(fullPhone);
    } catch (err: unknown) {
      showError(getErrorMessage(err, translate("auth.invalidPhone")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Text style={styles.title}>{translate("auth.welcome")}</Text>
      <Text style={styles.subtitle}>{translate("auth.phoneSubtitle")}</Text>

      <Text style={styles.fieldLabel}>{translate("auth.phoneLabel")}</Text>

      <View style={styles.phoneRow}>
        <TouchableOpacity style={styles.countryButton} onPress={() => setShowPicker(true)} activeOpacity={0.7}>
          <Text style={styles.countryFlag}>{country.flag}</Text>
          <Text style={styles.countryDial}>{country.dial}</Text>
          <Text style={styles.countryArrow}>▾</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.phoneInput}
          placeholder={translate("auth.phonePlaceholder")}
          placeholderTextColor={colors.textMuted}
          keyboardType='phone-pad'
          value={phone}
          onChangeText={setPhone}
          autoFocus
        />
      </View>

      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleContinue} disabled={loading}>
        <LinearGradient colors={[colors.primary, colors.primaryDark]} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.buttonGradient}>
          {loading ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>{translate("auth.continue")}</Text>}
        </LinearGradient>
      </TouchableOpacity>

      <Text style={styles.hint}>{translate("auth.hint")}</Text>

      {/* Country picker modal */}
      <Modal visible={showPicker} animationType='slide' transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, {backgroundColor: colors.surface}]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{translate("auth.selectCountry")}</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowPicker(false);
                  setSearch("");
                }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput style={styles.modalSearch} placeholder={translate("auth.searchCountry")} placeholderTextColor={colors.textMuted} value={search} onChangeText={setSearch} autoFocus />

            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => `${item.flag}-${item.dial}-${item.name}`}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[styles.countryItem, item.name === country.name && item.dial === country.dial && styles.countryItemSelected]}
                  onPress={() => {
                    setCountry(item);
                    setShowPicker(false);
                    setSearch("");
                  }}>
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

// ── Lockout helper ──────────────────────────────────────
// attempts 1-2: no lockout | 3rd: 60s | 4th: 60s | 5th+: 300s
const getLockoutSeconds = (attempts: number): number => {
  if (attempts < 3) return 0;
  if (attempts < 5) return 60;
  return 300;
};

// ── PIN Step ────────────────────────────────────────────
function PINStep() {
  const {translate} = useI18n();
  const {colors} = useTheme();
  const {loginWithPin, pendingPhone, resetAuth, goToReset} = useAuth();
  const styles = createStyles(colors);

  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [secsLeft, setSecsLeft] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startLockout = (secs: number) => {
    setSecsLeft(secs);
    timerRef.current = setInterval(() => {
      setSecsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const isLocked = secsLeft > 0;

  const handlePinChange = (text: string, index: number) => {
    if (isLocked) return;
    const newPin = [...pin];
    if (text.length > 1) {
      const digits = text.replace(/\D/g, "").split("").slice(0, 6);
      digits.forEach((d, i) => {
        if (i < 6) newPin[i] = d;
      });
      setPin(newPin);
      const nextEmpty = digits.length < 6 ? digits.length : 5;
      inputRefs.current[nextEmpty]?.focus();
      if (digits.length === 6) handleLogin(newPin.join(""));
      return;
    }
    newPin[index] = text;
    setPin(newPin);
    if (text && index < 5) inputRefs.current[index + 1]?.focus();
    if (text && index === 5) handleLogin(newPin.join(""));
  };

  const handleKeyPress = (e: {nativeEvent: {key: string}}, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleLogin = async (fullPin?: string) => {
    if (isLocked) return;
    const entered = fullPin || pin.join("");
    if (entered.length !== 6) {
      setErrorMsg(translate("auth.invalidPin"));
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      await loginWithPin(entered);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "EMAIL_NOT_CONFIRMED") {
        setErrorMsg(translate("auth.emailNotConfirmed"));
        setPin(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setPin(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();

        const lockSecs = getLockoutSeconds(newAttempts);
        if (lockSecs > 0) {
          const mins = lockSecs / 60;
          setErrorMsg(translate("auth.pinLocked", {mins: String(mins)}));
          startLockout(lockSecs);
        } else {
          const left = 3 - newAttempts;
          setErrorMsg(translate("auth.wrongPinAttempts", {n: String(left)}));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Text style={styles.title}>{translate("auth.pinTitle")}</Text>
      <Text style={styles.subtitle}>{translate("auth.pinSubtitle", {phone: pendingPhone || ""})}</Text>

      <View style={styles.otpContainer}>
        {pin.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            style={[styles.otpInput, digit ? styles.otpInputFilled : null, errorMsg ? styles.otpInputError : null, isLocked ? styles.otpInputBlocked : null]}
            keyboardType='number-pad'
            maxLength={index === 0 ? 6 : 1}
            value={digit}
            onChangeText={(text) => handlePinChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            autoFocus={index === 0}
            editable={!loading && !isLocked}
            secureTextEntry
          />
        ))}
      </View>

      {errorMsg || isLocked ? (
        <View style={[styles.errorBanner, isLocked && {borderColor: colors.warning + "60"}]}>
          <Text style={[styles.errorText, isLocked && {color: colors.warning}]}>{isLocked ? translate("auth.pinLockedCountdown", {s: String(secsLeft)}) : errorMsg}</Text>
        </View>
      ) : null}

      <TouchableOpacity style={[styles.button, (loading || isLocked) && styles.buttonDisabled]} onPress={() => handleLogin()} disabled={loading || isLocked}>
        <LinearGradient colors={[colors.primary, colors.primaryDark]} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.buttonGradient}>
          {loading ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>{translate("auth.pinButton")}</Text>}
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.linkRow}>
        <TouchableOpacity onPress={goToReset} style={styles.linkButton} disabled={isLocked}>
          <Text style={[styles.linkText, isLocked && {color: colors.textMuted}]}>{translate("auth.forgotPin")}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={resetAuth} style={styles.linkButton} disabled={isLocked}>
          <Text style={[styles.linkText, isLocked && {color: colors.textMuted}]}>{translate("auth.changePhone")}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

// ── Reset Step ──────────────────────────────────────────
function ResetStep() {
  const {translate} = useI18n();
  const {colors} = useTheme();
  const {resetPin, resetAuth} = useAuth();
  const {showError} = useToast();
  const styles = createStyles(colors);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      showError(translate("auth.invalidEmail"));
      return;
    }
    setLoading(true);
    try {
      await resetPin(cleanEmail);
      setSent(true);
    } catch (err: unknown) {
      showError(getErrorMessage(err, translate("auth.resetError")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Text style={styles.title}>{translate("auth.resetTitle")}</Text>
      <Text style={styles.subtitle}>{translate("auth.resetSubtitle")}</Text>

      {sent ? (
        <View style={styles.errorBanner}>
          <Text style={[styles.errorText, {color: colors.primary}]}>{translate("auth.resetSuccess")}</Text>
        </View>
      ) : (
        <>
          <Text style={styles.fieldLabel}>{translate("auth.emailLabel")}</Text>
          <TextInput
            style={styles.input}
            placeholder={translate("auth.emailPlaceholder")}
            placeholderTextColor={colors.textMuted}
            keyboardType='email-address'
            autoCapitalize='none'
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            autoFocus
          />

          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleReset} disabled={loading}>
            <LinearGradient colors={[colors.primary, colors.primaryDark]} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.buttonGradient}>
              {loading ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>{translate("auth.resetButton")}</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity onPress={resetAuth} style={styles.linkButton}>
        <Text style={styles.linkText}>{translate("auth.backToLogin")}</Text>
      </TouchableOpacity>
    </>
  );
}

// ── New PIN Step (password recovery) ────────────────────
function NewPinStep() {
  const {translate} = useI18n();
  const {colors} = useTheme();
  const {updatePin} = useAuth();
  const {showError, showSuccess} = useToast();
  const styles = createStyles(colors);

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      showError(translate("auth.invalidPin"));
      return;
    }
    if (isWeakPin(pin)) {
      showError(translate("auth.weakPin"));
      return;
    }
    if (pin !== confirmPin) {
      showError(translate("auth.pinMismatch"));
      return;
    }
    setLoading(true);
    try {
      await updatePin(pin);
      showSuccess(translate("auth.newPinSuccess"));
    } catch (err: unknown) {
      showError(getErrorMessage(err, translate("auth.resetError")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Text style={styles.title}>{translate("auth.newPinTitle")}</Text>
      <Text style={styles.subtitle}>{translate("auth.newPinSubtitle")}</Text>

      <Text style={styles.fieldLabel}>{translate("auth.newPinLabel")}</Text>
      <TextInput style={styles.input} placeholder='••••••' placeholderTextColor={colors.textMuted} keyboardType='numeric' secureTextEntry maxLength={6} value={pin} onChangeText={setPin} autoFocus />

      <Text style={styles.fieldLabel}>{translate("auth.newPinConfirmLabel")}</Text>
      <TextInput
        style={styles.input}
        placeholder='••••••'
        placeholderTextColor={colors.textMuted}
        keyboardType='numeric'
        secureTextEntry
        maxLength={6}
        value={confirmPin}
        onChangeText={setConfirmPin}
      />

      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleUpdate} disabled={loading}>
        <LinearGradient colors={[colors.primary, colors.primaryDark]} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.buttonGradient}>
          {loading ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>{translate("auth.newPinButton")}</Text>}
        </LinearGradient>
      </TouchableOpacity>
    </>
  );
}

// ── Register Step ───────────────────────────────────────
function RegisterStep() {
  const {translate} = useI18n();
  const {colors} = useTheme();
  const {register, pendingPhone, resetAuth} = useAuth();
  const {showError} = useToast();
  const styles = createStyles(colors);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim()) {
      showError(translate("auth.noName"));
      return;
    }
    const cleanUsername = username
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._]/g, "");
    if (!cleanUsername || cleanUsername.length < 3) {
      showError(translate("auth.invalidUsername"));
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      showError(translate("auth.invalidEmail"));
      return;
    }
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      showError(translate("auth.invalidPin"));
      return;
    }
    if (isWeakPin(pin)) {
      showError(translate("auth.weakPin"));
      return;
    }
    if (pin !== confirmPin) {
      showError(translate("auth.pinMismatch"));
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), cleanUsername, documentId.trim(), pin, cleanEmail);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("over_email_send_rate_limit") || msg.toLowerCase().includes("email rate limit")) {
        showError(translate("auth.emailRateLimit"));
      } else {
        showError(getErrorMessage(err, translate("auth.errorRegistering")));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Text style={styles.title}>{translate("auth.registerTitle")}</Text>
      <Text style={styles.subtitle}>{translate("auth.registerSubtitle", {phone: pendingPhone || ""})}</Text>

      <View style={styles.labelRow}>
        <Text style={styles.fieldLabel}>{translate("auth.nameLabel")}</Text>
        <Text style={styles.required}>*</Text>
      </View>
      <TextInput style={styles.input} placeholder={translate("auth.namePlaceholder")} placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} autoFocus />

      <View style={styles.labelRow}>
        <Text style={styles.fieldLabel}>{translate("auth.usernameLabel")}</Text>
        <Text style={styles.required}>*</Text>
      </View>
      <TextInput
        style={styles.input}
        placeholder={translate("auth.usernamePlaceholder")}
        placeholderTextColor={colors.textMuted}
        value={username}
        onChangeText={(text) => setUsername(text.toLowerCase().replace(/\s/g, ""))}
        autoCapitalize='none'
        autoCorrect={false}
      />

      <View style={styles.labelRow}>
        <Text style={styles.fieldLabel}>{translate("auth.documentLabel")}</Text>
        <Text style={styles.optional}>{translate("common.optional")}</Text>
      </View>
      <TextInput
        style={styles.input}
        placeholder={translate("auth.documentPlaceholder")}
        placeholderTextColor={colors.textMuted}
        keyboardType='numeric'
        value={documentId}
        onChangeText={setDocumentId}
      />

      <View style={styles.labelRow}>
        <Text style={styles.fieldLabel}>{translate("auth.emailLabel")}</Text>
        <Text style={styles.required}>*</Text>
      </View>
      <TextInput
        style={styles.input}
        placeholder={translate("auth.emailPlaceholder")}
        placeholderTextColor={colors.textMuted}
        keyboardType='email-address'
        autoCapitalize='none'
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
      />

      <View style={styles.labelRow}>
        <Text style={styles.fieldLabel}>{translate("auth.pinSetLabel")}</Text>
        <Text style={styles.required}>*</Text>
      </View>
      <TextInput style={styles.input} placeholder='••••••' placeholderTextColor={colors.textMuted} keyboardType='number-pad' maxLength={6} secureTextEntry value={pin} onChangeText={setPin} />

      <View style={styles.labelRow}>
        <Text style={styles.fieldLabel}>{translate("auth.pinConfirmLabel")}</Text>
        <Text style={styles.required}>*</Text>
      </View>
      <TextInput
        style={styles.input}
        placeholder='••••••'
        placeholderTextColor={colors.textMuted}
        keyboardType='number-pad'
        maxLength={6}
        secureTextEntry
        value={confirmPin}
        onChangeText={setConfirmPin}
      />

      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading}>
        <LinearGradient colors={[colors.primary, colors.primaryDark]} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.buttonGradient}>
          {loading ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>{translate("auth.registerButton")}</Text>}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity onPress={resetAuth} style={styles.linkButton}>
        <Text style={styles.linkText}>{translate("auth.changePhone")}</Text>
      </TouchableOpacity>
    </>
  );
}

// ── Main Login Screen ───────────────────────────────────
export default function LoginScreen() {
  const {colors, isDark} = useTheme();
  const {authStep} = useAuth();
  const styles = createStyles(colors);

  const gradientColors: [string, string, string] = isDark ? ["#0c0a06", "#131008", "#1a1510"] : ["#fdf8f0", "#f5ede0", "#eee0cb"];

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps='handled'>
          <View style={styles.headerControls}>
            <HeaderControls />
          </View>

          <VacaLogo size='lg' style={{marginTop: spacing.xxl}} />

          <View style={[styles.card, {backgroundColor: colors.surface2, borderColor: colors.surfaceBorder}]}>
            <View style={styles.cardInner}>
              {authStep === "phone" && <PhoneStep />}
              {authStep === "pin" && <PINStep />}
              {authStep === "register" && <RegisterStep />}
              {authStep === "reset" && <ResetStep />}
              {authStep === "new-pin" && <NewPinStep />}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: {flex: 1},
    container: {flex: 1},
    content: {
      flexGrow: 1,
      padding: spacing.lg,
      alignItems: "center",
      paddingBottom: spacing.xxl,
    },
    headerControls: {
      position: "absolute",
      top: spacing.xl,
      right: 0,
    },
    card: {
      width: "100%",
      marginTop: spacing.xl,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      overflow: "hidden",
    },
    cardInner: {
      padding: spacing.lg,
      alignItems: "center",
    },
    title: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: colors.text,
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
      textAlign: "center",
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: spacing.xl,
      lineHeight: 20,
    },
    fieldLabel: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      color: colors.textMuted,
      alignSelf: "flex-start",
      marginBottom: spacing.xs,
      marginTop: spacing.sm,
      textTransform: "uppercase",
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
      width: "100%",
      marginBottom: spacing.sm,
    },
    button: {
      width: "100%",
      borderRadius: borderRadius.md,
      overflow: "hidden",
      marginTop: spacing.md,
    },
    buttonDisabled: {opacity: 0.55},
    buttonGradient: {
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.xxl,
      alignItems: "center",
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
      textAlign: "center",
      marginTop: spacing.lg,
      lineHeight: 18,
    },
    phoneRow: {
      flexDirection: "row",
      width: "100%",
      marginBottom: spacing.sm,
      gap: spacing.xs,
    },
    countryButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.md,
      gap: 4,
    },
    countryFlag: {fontSize: 20},
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
      justifyContent: "flex-end",
    },
    modalContainer: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "70%",
      paddingBottom: spacing.xxl,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
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
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.surfaceBorder,
    },
    countryItemSelected: {
      backgroundColor: colors.primary + "12",
    },
    countryItemFlag: {fontSize: 22, marginRight: spacing.md},
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
    // PIN / OTP styles
    otpContainer: {
      flexDirection: "row",
      justifyContent: "center",
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
      textAlign: "center",
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: colors.text,
    },
    otpInputFilled: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + "10",
    },
    otpInputError: {
      borderColor: colors.danger,
      backgroundColor: colors.danger + "0d",
    },
    otpInputBlocked: {
      borderColor: colors.warning,
      opacity: 0.5,
    },
    errorBanner: {
      backgroundColor: colors.danger + "18",
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.danger + "40",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.md,
      width: "100%",
      alignItems: "center",
    },
    errorText: {
      color: colors.danger,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      textAlign: "center",
    },
    linkRow: {
      flexDirection: "row",
      justifyContent: "space-evenly",
      width: "100%",
      marginTop: spacing.md,
    },
    linkButton: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
    },
    linkText: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textDecorationLine: "underline",
    },
    labelRow: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      width: "100%",
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
      fontStyle: "italic",
    },
  });
