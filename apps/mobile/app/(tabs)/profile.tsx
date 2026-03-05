import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useToast } from '../../src/components/Toast';
import { GlassCard, Avatar } from '../../src/components';
import { spacing, borderRadius, fontSize, fontWeight, type ThemeColors } from '../../src/constants/theme';
import { useI18n } from '../../src/i18n';
import { useTheme } from '../../src/theme';
import { useAuth } from '../../src/auth';

export default function ProfileTab() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { user, logout, updateProfile, deleteAccount } = useAuth();
  const { showError, showSuccess } = useToast();
  const s = createStyles(colors);

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
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
      await updateProfile({ [editingField]: editValue.trim() });
      setEditingField(null);
      showSuccess(t('profile.savedSuccess'));
    } catch (err: any) {
      showError(err.message || t('profile.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showError(t('profile.permissionNeeded'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (!asset.base64) {
        showError(t('profile.avatarError'));
        return;
      }
      const sizeKb = Math.round((asset.base64.length * 3) / 4 / 1024);
      if (sizeKb > 3500) {
        showError(t('profile.avatarTooLarge', { size: String(sizeKb) }));
        return;
      }
      setUploadingAvatar(true);
      try {
        const avatarUrl = `data:image/jpeg;base64,${asset.base64}`;
        await updateProfile({ avatarUrl });
        showSuccess(t('profile.avatarSuccess'));
      } catch (err: any) {
        showError(err.message || t('profile.saveError'));
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
      showError(t('profile.deleteError'));
      setDeletingAccount(false);
      setConfirmDelete(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      setLoggingOut(false);
    }
  };

  if (!user) return null;

  const renderField = (label: string, field: string, value: string, editable = true) => (
    <View key={field}>
      <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
        <Text style={s.label}>{label}</Text>
        {editingField === field ? (
          <View style={s.editRow}>
            <TextInput
              style={s.editInput}
              value={editValue}
              onChangeText={setEditValue}
              autoFocus
              autoCapitalize={field === 'username' ? 'none' : 'words'}
            />
            <TouchableOpacity style={s.saveBtn} onPress={saveEdit} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color={colors.background} />
                : <Text style={s.saveBtnText}>✓</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={cancelEdit}>
              <Text style={s.cancelBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => editable && startEdit(field, value)}
            disabled={!editable}
          >
            <Text style={s.value}>
              {value || '—'} {editable ? ' ✏️' : ''}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={s.divider} />
    </View>
  );

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {/* Avatar with accent ring */}
      <TouchableOpacity style={s.avatarContainer} onPress={handlePickImage} activeOpacity={0.7}>
        <Avatar displayName={user.displayName} avatarUrl={user.avatarUrl} size={80} showRing />
        <View style={s.cameraIcon}>
          {uploadingAvatar
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Text style={s.cameraText}>📷</Text>}
        </View>
      </TouchableOpacity>

      {/* User info card */}
      <GlassCard style={s.card}>
        {renderField(t('profile.name'), 'displayName', user.displayName)}
        {renderField(t('profile.username'), 'username', user.username || '', true)}
        {renderField(t('profile.phone'), 'phone', user.phone, false)}
        {renderField(t('profile.document'), 'documentId', user.documentId || '', true)}

        <View style={s.divider} />
        <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
          <Text style={s.label}>{t('profile.memberSince')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Text style={s.value}>{new Date(user.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>
      </GlassCard>

      {/* Premium banner */}
      <View style={s.premiumBanner}>
        <Text style={s.premiumBannerText}>✨ {t('premium.title')}</Text>
        <Text style={s.premiumBannerSub}>{t('premium.subtitle')}</Text>
        <TouchableOpacity style={s.premiumCta} activeOpacity={0.8}>
          <Text style={s.premiumCtaText}>{t('premium.cta')}</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={[s.logoutButton, loggingOut && { opacity: 0.5 }]}
        onPress={handleLogout}
        activeOpacity={0.7}
        disabled={loggingOut}
      >
        {loggingOut
          ? <ActivityIndicator color={colors.danger} />
          : <Text style={s.logoutButtonText}>{t('profile.logout')}</Text>}
      </TouchableOpacity>

      {/* Delete account */}
      {confirmDelete ? (
        <GlassCard style={s.deleteConfirmBox}>
          <Text style={s.deleteConfirmTitle}>{t('profile.deleteTitle')} ⚠️</Text>
          <Text style={s.deleteConfirmMessage}>{t('profile.deleteMessage')}</Text>
          <View style={s.deleteConfirmRow}>
            <TouchableOpacity
              style={s.deleteCancelBtn}
              onPress={() => setConfirmDelete(false)}
              disabled={deletingAccount}
            >
              <Text style={s.deleteCancelBtnText}>{t('profile.deleteCancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.deleteConfirmBtn, deletingAccount && { opacity: 0.5 }]}
              onPress={handleDeleteAccount}
              disabled={deletingAccount}
            >
              {deletingAccount
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.deleteConfirmBtnText}>{t('profile.deleteConfirm')}</Text>}
            </TouchableOpacity>
          </View>
        </GlassCard>
      ) : (
        <TouchableOpacity
          style={[s.deleteButton, loggingOut && { opacity: 0.4 }]}
          onPress={() => setConfirmDelete(true)}
          activeOpacity={0.7}
          disabled={loggingOut}
        >
          <Text style={s.deleteButtonText}>{t('profile.deleteAccount')}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { padding: spacing.lg, paddingBottom: 120 },
    avatarContainer: {
      alignItems: 'center',
      marginVertical: spacing.xl,
      position: 'relative',
    },
    cameraIcon: {
      position: 'absolute',
      bottom: 0,
      right: '35%',
      backgroundColor: colors.surface2,
      borderRadius: 16,
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    cameraText: { fontSize: 15 },
    card: {
      padding: 0,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      overflow: 'hidden',
    },
    label: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 2,
    },
    value: {
      fontSize: fontSize.md,
      color: colors.text,
      fontWeight: fontWeight.medium,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.surfaceBorder,
    },
    editRow: { flexDirection: 'row', alignItems: 'center' },
    editInput: {
      flex: 1,
      fontSize: fontSize.md,
      color: colors.text,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.sm,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    saveBtn: {
      marginLeft: spacing.sm,
      backgroundColor: colors.primary,
      width: 34,
      height: 34,
      borderRadius: 17,
      justifyContent: 'center',
      alignItems: 'center',
    },
    saveBtnText: { color: colors.background, fontSize: fontSize.md, fontWeight: fontWeight.bold },
    cancelBtn: {
      marginLeft: spacing.xs,
      backgroundColor: colors.surface,
      width: 34,
      height: 34,
      borderRadius: 17,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    cancelBtnText: { color: colors.textMuted, fontSize: fontSize.md, fontWeight: fontWeight.bold },
    premiumBanner: {
      marginTop: spacing.xl,
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.accent + '50',
      backgroundColor: colors.accent + '10',
      gap: spacing.sm,
    },
    premiumBannerText: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.bold,
      color: colors.accent,
    },
    premiumBannerSub: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    premiumCta: {
      alignSelf: 'flex-start',
      backgroundColor: colors.accent,
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
    },
    premiumCtaText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.bold,
      color: colors.background,
    },
    logoutButton: {
      marginTop: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 1.5,
      borderColor: colors.danger + '60',
      alignItems: 'center',
    },
    logoutButtonText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: colors.danger,
    },
    deleteButton: {
      marginTop: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      alignItems: 'center',
    },
    deleteButtonText: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.medium,
      color: colors.textMuted,
      textDecorationLine: 'underline',
    },
    deleteConfirmBox: {
      marginTop: spacing.md,
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.danger + '40',
      backgroundColor: colors.danger + '08',
    },
    deleteConfirmTitle: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.bold,
      color: colors.danger,
      marginBottom: spacing.sm,
    },
    deleteConfirmMessage: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
      lineHeight: 20,
      marginBottom: spacing.lg,
    },
    deleteConfirmRow: { flexDirection: 'row', gap: spacing.sm },
    deleteCancelBtn: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      alignItems: 'center',
    },
    deleteCancelBtnText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: colors.text,
    },
    deleteConfirmBtn: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      backgroundColor: colors.danger,
      alignItems: 'center',
    },
    deleteConfirmBtnText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.bold,
      color: '#fff',
    },
  });
