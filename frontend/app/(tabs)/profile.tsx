import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { GlassCard, Avatar, PaymentAccountCard, PaymentAccountForm, type PaymentAccountInput, useToast } from '../../src/components';
import { spacing, borderRadius, fontSize, fontWeight, type ThemeColors } from '../../src/constants/theme';
import { useI18n } from '../../src/i18n';
import { useTheme } from '../../src/theme';
import { useAuth } from '../../src/auth';
import { getErrorMessage } from '../../src/utils/errorMessage';
import { formatCOP, type PaymentAccount, type PaymentSession, type SplitMode } from '@lavaca/types';
import { api } from '../../src/services/api';
export default function ProfileTab() {
  const { translate } = useI18n();
  const { colors } = useTheme();
  const { user, logout, updateProfile, deleteAccount } = useAuth();
  const { showError, showSuccess } = useToast();
  const styles = createStyles(colors);

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sessions, setSessions] = useState<PaymentSession[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [loadingPaymentAccounts, setLoadingPaymentAccounts] = useState(false);
  const [savingPaymentAccount, setSavingPaymentAccount] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingPaymentAccount, setEditingPaymentAccount] = useState<PaymentAccount | undefined>(undefined);
  
  useEffect(() => {
    if (!user) return;
    setLoadingStats(true);
    api.getUserHistory(user.id)
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);
  
  const stats = useMemo(() => {
    const totalSessions = sessions.length;
    const totalAmount = sessions.reduce((sum, s) => {
      const my = s.participants.find(p => p.userId === user?.id);
      return sum + (my?.amount || 0);
    }, 0);
    const asAdmin = sessions.filter(s => s.adminId === user?.id).length;
    const asParticipant = totalSessions - asAdmin;
    const modeCount: Partial<Record<SplitMode, number>> = {};
    sessions.forEach(s => { modeCount[s.splitMode] = (modeCount[s.splitMode] || 0) + 1; });
    const favoriteMode = (Object.entries(modeCount) as [SplitMode, number][])
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    const now = new Date();
    const thisMonth = sessions.filter(s => {
      const d = new Date(s.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    return { totalSessions, totalAmount, asAdmin, asParticipant, favoriteMode, thisMonth };
  }, [sessions, user?.id]);

  const MODE_ICON: Record<SplitMode, keyof typeof Feather.glyphMap> = {
    equal: 'pie-chart',
    percentage: 'bar-chart-2',
    roulette: 'shuffle',
  };

  const loadPaymentAccounts = useMemo(
    () => async (targetUserId: string) => {
      setLoadingPaymentAccounts(true);
      try {
        const accounts = await api.getPaymentAccounts(targetUserId);
        setPaymentAccounts(accounts);
      } catch (err: unknown) {
        showError(getErrorMessage(err, translate('common.error')));
      } finally {
        setLoadingPaymentAccounts(false);
      }
    },
    [showError, translate]
  );

  useEffect(() => {
    if (!user) return;
    loadPaymentAccounts(user.id);
  }, [user, loadPaymentAccounts]);

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
      showSuccess(translate('profile.savedSuccess'));
    } catch (err: unknown) {
      showError(getErrorMessage(err, translate('profile.saveError')));
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
      showError(translate('profile.permissionNeeded'));
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
        showError(translate('profile.avatarError'));
        return;
      }
      const sizeKb = Math.round((asset.base64.length * 3) / 4 / 1024);
      if (sizeKb > 3500) {
        showError(translate('profile.avatarTooLarge', { size: String(sizeKb) }));
        return;
      }
      setUploadingAvatar(true);
      try {
        const avatarUrl = `data:image/jpeg;base64,${asset.base64}`;
        await updateProfile({ avatarUrl });
        showSuccess(translate('profile.avatarSuccess'));
      } catch (err: unknown) {
        showError(getErrorMessage(err, translate('profile.saveError')));
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
      showError(translate('profile.deleteError'));
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

  const handleOpenPaymentForm = (account?: PaymentAccount) => {
    setEditingPaymentAccount(account);
    setShowPaymentForm(true);
  };

  const handleClosePaymentForm = () => {
    if (savingPaymentAccount) return;
    setShowPaymentForm(false);
    setEditingPaymentAccount(undefined);
  };

  const handleSavePaymentAccount = async (payload: PaymentAccountInput) => {
    if (!user) return;
    setSavingPaymentAccount(true);
    try {
      if (editingPaymentAccount) {
        await api.updatePaymentAccount(editingPaymentAccount.id, user.id, payload);
      } else {
        await api.createPaymentAccount(user.id, payload);
      }

      await loadPaymentAccounts(user.id);
      setShowPaymentForm(false);
      setEditingPaymentAccount(undefined);
      showSuccess(translate('payment.saveSuccess'));
    } catch (err: unknown) {
      showError(getErrorMessage(err, translate('common.error')));
    } finally {
      setSavingPaymentAccount(false);
    }
  };

  const handleDeletePaymentAccount = async (accountId: string) => {
    if (!user) return;

    Alert.alert(
      translate('payment.methods'),
      translate('payment.deleteConfirm'),
      [
        { text: translate('common.cancel'), style: 'cancel' },
        {
          text: translate('payment.deleteAction'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deletePaymentAccount(accountId, user.id);
              await loadPaymentAccounts(user.id);
              showSuccess(translate('payment.deleteSuccess'));
            } catch (err: unknown) {
              showError(getErrorMessage(err, translate('common.error')));
            }
          },
        },
      ]
    );
  };

  const handleSetPreferredAccount = async (accountId: string) => {
    if (!user) return;
    try {
      await api.setPreferredPaymentAccount(accountId, user.id);
      await loadPaymentAccounts(user.id);
      showSuccess(translate('payment.setPreferredSuccess'));
    } catch (err: unknown) {
      showError(getErrorMessage(err, translate('common.error')));
    }
  };
  
  if (!user) return null;

  const renderField = (label: string, field: string, value: string, editable = true) => (
    <View key={field}>
      <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
        <Text style={styles.label}>{label}</Text>
        {editingField === field ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.editInput}
              value={editValue}
              onChangeText={setEditValue}
              autoFocus
              autoCapitalize={field === 'username' ? 'none' : 'words'}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={saveEdit} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color={colors.background} />
                : <Feather name='check' size={16} color={colors.background} />}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={cancelEdit}>
              <Feather name='x' size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => editable && startEdit(field, value)}
            disabled={!editable}
          >
            <View style={styles.valueRow}>
              <Text style={styles.value}>{value || '—'}</Text>
              {editable ? <Feather name='edit-2' size={13} color={colors.textMuted} /> : null}
            </View>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.divider} />
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {/* Stats Card */}
      {!loadingStats && stats.totalSessions > 0 && (
        <GlassCard style={styles.statsCard}>
          <Text style={styles.statsTitle}>{translate('profile.stats')}</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalSessions}</Text>
              <Text style={styles.statLabel}>{translate('profile.totalSessions')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.accent }]}>{formatCOP(stats.totalAmount)}</Text>
              <Text style={styles.statLabel}>{translate('profile.totalAmount')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.asAdmin}</Text>
              <Text style={styles.statLabel}>{translate('profile.asAdmin')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.asParticipant}</Text>
              <Text style={styles.statLabel}>{translate('profile.asParticipant')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.thisMonth}</Text>
              <Text style={styles.statLabel}>{translate('profile.thisMonth')}</Text>
            </View>
            {stats.favoriteMode && (
              <View style={styles.statItem}>
                <Feather name={MODE_ICON[stats.favoriteMode]} size={20} color={colors.text} />
                <Text style={styles.statLabel}>{translate('profile.favoriteMode')}</Text>
              </View>
            )}
          </View>
        </GlassCard>
      )}

      {/* Avatar with accent ring */}
      <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage} activeOpacity={0.7}>
        <Avatar displayName={user.displayName} avatarUrl={user.avatarUrl} size={90} showRing />
        <View style={styles.cameraIcon}>
          {uploadingAvatar
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Feather name='camera' size={15} color={colors.textSecondary} />}
        </View>
      </TouchableOpacity>
      <Text style={styles.profileName}>{user.displayName}</Text>
      <Text style={styles.profileUsername}>@{user.username}</Text>

      {/* User info card */}
      <Text style={styles.sectionLabel}>{translate('profile.personalInfo')}</Text>
      <GlassCard style={styles.card}>
        {renderField(translate('profile.name'), 'displayName', user.displayName)}
        {renderField(translate('profile.username'), 'username', user.username || '', true)}
        {renderField(translate('profile.phone'), 'phone', user.phone, false)}
        {renderField(translate('profile.document'), 'documentId', user.documentId || '', true)}

        <View style={styles.divider} />
        <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
          <Text style={styles.label}>{translate('profile.memberSince')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Text style={styles.value}>{new Date(user.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>
      </GlassCard>

      <Text style={styles.sectionLabel}>{translate('payment.methods')}</Text>
      <GlassCard style={styles.paymentCard}>
        {loadingPaymentAccounts ? (
          <ActivityIndicator color={colors.primary} />
        ) : paymentAccounts.length === 0 ? (
          <View style={styles.emptyPaymentState}>
            <Text style={styles.emptyPaymentTitle}>{translate('payment.noMethods')}</Text>
            <Text style={styles.emptyPaymentHint}>{translate('payment.noMethodsHint')}</Text>
          </View>
        ) : (
          <View style={styles.paymentList}>
            {paymentAccounts.map((account) => (
              <PaymentAccountCard
                key={account.id}
                account={account}
                onEdit={handleOpenPaymentForm}
                onDelete={handleDeletePaymentAccount}
                onSetPreferred={handleSetPreferredAccount}
              />
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.addPaymentBtn} onPress={() => handleOpenPaymentForm()}>
          <Text style={styles.addPaymentBtnText}>
            {paymentAccounts.length === 0 ? translate('payment.addMethod') : translate('payment.addAnother')}
          </Text>
        </TouchableOpacity>
      </GlassCard>

      {/* Logout */}
      <TouchableOpacity
        style={[styles.logoutButton, loggingOut && { opacity: 0.5 }]}
        onPress={handleLogout}
        activeOpacity={0.7}
        disabled={loggingOut}
      >
        {loggingOut
          ? <ActivityIndicator color={colors.danger} />
          : <Text style={styles.logoutButtonText}>{translate('profile.logout')}</Text>}
      </TouchableOpacity>

      {/* Delete account */}
      {confirmDelete ? (
        <GlassCard style={styles.deleteConfirmBox}>
          <View style={styles.deleteConfirmTitleRow}>
            <Feather name='alert-triangle' size={16} color={colors.danger} />
            <Text style={styles.deleteConfirmTitle}>{translate('profile.deleteTitle')}</Text>
          </View>
          <Text style={styles.deleteConfirmMessage}>{translate('profile.deleteMessage')}</Text>
          <View style={styles.deleteConfirmRow}>
            <TouchableOpacity
              style={styles.deleteCancelBtn}
              onPress={() => setConfirmDelete(false)}
              disabled={deletingAccount}
            >
              <Text style={styles.deleteCancelBtnText}>{translate('profile.deleteCancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteConfirmBtn, deletingAccount && { opacity: 0.5 }]}
              onPress={handleDeleteAccount}
              disabled={deletingAccount}
            >
              {deletingAccount
                ? <ActivityIndicator color={colors.white} size="small" />
                : <Text style={styles.deleteConfirmBtnText}>{translate('profile.deleteConfirm')}</Text>}
            </TouchableOpacity>
          </View>
        </GlassCard>
      ) : (
        <TouchableOpacity
          style={[styles.deleteButton, loggingOut && { opacity: 0.4 }]}
          onPress={() => setConfirmDelete(true)}
          activeOpacity={0.7}
          disabled={loggingOut}
        >
          <Text style={styles.deleteButtonText}>{translate('profile.deleteAccount')}</Text>
        </TouchableOpacity>
      )}

      <PaymentAccountForm
        visible={showPaymentForm}
        loading={savingPaymentAccount}
        initialValue={editingPaymentAccount}
        onClose={handleClosePaymentForm}
        onSubmit={handleSavePaymentAccount}
      />
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
    valueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
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
    },
    deleteConfirmTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
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
      color: colors.white,
    },
    statsCard: {
      marginBottom: spacing.md,
      padding: spacing.md,
    },
    statsTitle: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.bold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: spacing.md,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    statItem: {
      flex: 1,
      minWidth: '28%',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    statNumber: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.black,
      color: colors.text,
    },
    statLabel: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 2,
    },
    profileName: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.black,
      color: colors.text,
      marginTop: spacing.sm,
      textAlign: 'center',
    },
    profileUsername: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginTop: 2,
      textAlign: 'center',
    },
    sectionLabel: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.bold,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: spacing.sm,
      marginTop: spacing.md,
    },
    paymentCard: {
      padding: spacing.md,
      gap: spacing.sm,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    emptyPaymentState: {
      alignItems: 'center',
      paddingVertical: spacing.md,
      gap: spacing.xs,
    },
    emptyPaymentTitle: {
      color: colors.text,
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
    },
    emptyPaymentHint: {
      color: colors.textSecondary,
      fontSize: fontSize.sm,
      textAlign: 'center',
    },
    paymentList: {
      gap: spacing.sm,
    },
    addPaymentBtn: {
      borderWidth: 1,
      borderColor: colors.primary + '60',
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm,
      backgroundColor: colors.primary + '10',
    },
    addPaymentBtnText: {
      color: colors.primary,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.bold,
    },
  });
