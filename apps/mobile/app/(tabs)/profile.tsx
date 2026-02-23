import {useState} from "react";
import {View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {useToast} from "../../src/components/Toast";
import {spacing, borderRadius, fontSize, type ThemeColors} from "../../src/constants/theme";
import {useI18n} from "../../src/i18n";
import {useTheme} from "../../src/theme";
import {useAuth} from "../../src/auth";

export default function ProfileTab() {
  const {t} = useI18n();
  const {colors} = useTheme();
  const {user, logout, updateProfile, deleteAccount} = useAuth();
  const {showError, showSuccess} = useToast();
  const s = createStyles(colors);

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const startEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const saveEdit = async () => {
    if (!editingField || !editValue.trim()) return;
    setSaving(true);
    try {
      await updateProfile({[editingField]: editValue.trim()});
      setEditingField(null);
      showSuccess(t("profile.savedSuccess"));
    } catch (err: any) {
      showError(err.message || t("profile.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const handlePickImage = async () => {
    const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showError(t("profile.permissionNeeded"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      // quality bajo + tamaño pequeño para que el base64 no supere el limite del server (5mb)
      quality: 0.3,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (!asset.base64) {
        showError(t("profile.avatarError"));
        return;
      }
      // Validar tamaño: base64 ~1.33x del binario. Limite server 5mb => base64 max ~3.7mb
      const sizeKb = Math.round((asset.base64.length * 3) / 4 / 1024);
      if (sizeKb > 3500) {
        showError(t("profile.avatarTooLarge", { size: String(sizeKb) }));
        return;
      }
      setUploadingAvatar(true);
      try {
        const avatarUrl = `data:image/jpeg;base64,${asset.base64}`;
        await updateProfile({avatarUrl});
        showSuccess(t("profile.avatarSuccess"));
      } catch (err: any) {
        showError(err.message || t("profile.saveError"));
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await deleteAccount();
    } catch {
      showError(t("profile.deleteError"));
      setDeletingAccount(false);
      setConfirmDelete(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      // logout siempre debe funcionar
      setLoggingOut(false);
    }
  };

  if (!user) return null;

  const renderField = (label: string, field: string, value: string, editable: boolean = true) => (
    <View key={field}>
      <Text style={s.label}>{label}</Text>
      {editingField === field ? (
        <View style={s.editRow}>
          <TextInput style={s.editInput} value={editValue} onChangeText={setEditValue} autoFocus autoCapitalize={field === "username" ? "none" : "words"} />
          <TouchableOpacity style={s.saveBtn} onPress={saveEdit} disabled={saving}>
            {saving ? <ActivityIndicator size='small' color={colors.background} /> : <Text style={s.saveBtnText}>✓</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={s.cancelBtn} onPress={cancelEdit}>
            <Text style={s.cancelBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity activeOpacity={0.6} onPress={() => editable && startEdit(field, value)} disabled={!editable}>
          <Text style={s.value}>
            {value || "—"} {editable ? "✏️" : ""}
          </Text>
        </TouchableOpacity>
      )}
      <View style={s.divider} />
    </View>
  );

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps='handled'>
      {/* Avatar */}
      <TouchableOpacity style={s.avatarContainer} onPress={handlePickImage} activeOpacity={0.7}>
        {user.avatarUrl ? (
          <Image source={{uri: user.avatarUrl}} style={s.avatarImage} />
        ) : (
          <View style={s.avatar}>
            <Text style={s.avatarText}>{user.displayName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={s.cameraIcon}>
          {uploadingAvatar
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Text style={s.cameraText}>📷</Text>
          }
        </View>
      </TouchableOpacity>

      {/* User info card */}
      <View style={s.card}>
        {renderField(t("profile.name"), "displayName", user.displayName)}
        {renderField(t("profile.username"), "username", user.username || "", true)}
        {renderField(t("profile.phone"), "phone", user.phone, false)}
        {renderField(t("profile.document"), "documentId", user.documentId || "", true)}

        <Text style={s.label}>{t("profile.memberSince")}</Text>
        <Text style={s.value}>{new Date(user.createdAt).toLocaleDateString()}</Text>
      </View>

      {/* Logout */}
      <TouchableOpacity style={[s.logoutButton, loggingOut && {opacity: 0.5}]} onPress={handleLogout} activeOpacity={0.7} disabled={loggingOut}>
        {loggingOut ? <ActivityIndicator color={colors.danger} /> : <Text style={s.logoutButtonText}>{t("profile.logout")}</Text>}
      </TouchableOpacity>

      {confirmDelete ? (
        <View style={s.deleteConfirmBox}>
          <Text style={s.deleteConfirmTitle}>{t("profile.deleteTitle")} ⚠️</Text>
          <Text style={s.deleteConfirmMessage}>{t("profile.deleteMessage")}</Text>
          <View style={s.deleteConfirmRow}>
            <TouchableOpacity style={s.deleteCancelBtn} onPress={() => setConfirmDelete(false)} disabled={deletingAccount}>
              <Text style={s.deleteCancelBtnText}>{t("profile.deleteCancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.deleteConfirmBtn, deletingAccount && {opacity: 0.5}]} onPress={handleDeleteAccount} disabled={deletingAccount}>
              {deletingAccount
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.deleteConfirmBtnText}>{t("profile.deleteConfirm")}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={[s.deleteButton, loggingOut && {opacity: 0.4}]} onPress={() => setConfirmDelete(true)} activeOpacity={0.7} disabled={loggingOut}>
          <Text style={s.deleteButtonText}>{t("profile.deleteAccount")}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: spacing.lg,
      paddingBottom: 120,
    },
    avatarContainer: {
      alignItems: "center",
      marginVertical: spacing.xl,
      position: "relative",
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    avatarText: {
      fontSize: fontSize.hero,
      fontWeight: "bold",
      color: colors.background,
    },
    cameraIcon: {
      position: "absolute",
      bottom: 0,
      right: "35%",
      backgroundColor: colors.surface,
      borderRadius: 16,
      width: 32,
      height: 32,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: colors.surfaceBorder,
    },
    cameraText: {
      fontSize: 16,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    label: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: spacing.xs,
    },
    value: {
      fontSize: fontSize.lg,
      color: colors.text,
      fontWeight: "500",
    },
    divider: {
      height: 1,
      backgroundColor: colors.surfaceBorder,
      marginVertical: spacing.md,
    },
    editRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    editInput: {
      flex: 1,
      fontSize: fontSize.lg,
      color: colors.text,
      backgroundColor: colors.background,
      borderRadius: borderRadius.sm,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    saveBtn: {
      marginLeft: spacing.sm,
      backgroundColor: colors.primary,
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
    },
    saveBtnText: {
      color: colors.background,
      fontSize: fontSize.md,
      fontWeight: "bold",
    },
    cancelBtn: {
      marginLeft: spacing.xs,
      backgroundColor: colors.danger,
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
    },
    cancelBtnText: {
      color: colors.white,
      fontSize: fontSize.md,
      fontWeight: "bold",
    },
    logoutButton: {
      marginTop: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 2,
      borderColor: colors.danger,
      alignItems: "center",
    },
    logoutButtonText: {
      fontSize: fontSize.md,
      fontWeight: "600",
      color: colors.danger,
    },
    deleteButton: {
      marginTop: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      alignItems: "center",
      alignSelf: "stretch",
    },
    deleteButtonText: {
      fontSize: fontSize.sm,
      fontWeight: "500",
      color: colors.textMuted,
      textDecorationLine: "underline",
    },
    deleteConfirmBox: {
      marginTop: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1.5,
      borderColor: colors.danger,
      padding: spacing.lg,
    },
    deleteConfirmTitle: {
      fontSize: fontSize.md,
      fontWeight: "700",
      color: colors.danger,
      marginBottom: spacing.sm,
    },
    deleteConfirmMessage: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
      lineHeight: 20,
      marginBottom: spacing.lg,
    },
    deleteConfirmRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    deleteCancelBtn: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      alignItems: "center",
    },
    deleteCancelBtnText: {
      fontSize: fontSize.sm,
      fontWeight: "600",
      color: colors.text,
    },
    deleteConfirmBtn: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      backgroundColor: colors.danger,
      alignItems: "center",
    },
    deleteConfirmBtnText: {
      fontSize: fontSize.sm,
      fontWeight: "700",
      color: colors.white,
    },
  });
