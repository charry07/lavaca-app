import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { spacing, borderRadius, fontSize, type ThemeColors } from '../../src/constants/theme';
import { useI18n } from '../../src/i18n';
import { useTheme } from '../../src/theme';
import { useAuth } from '../../src/auth';

export default function ProfileTab() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { user, logout, updateProfile } = useAuth();
  const s = createStyles(colors);

  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || '');

  const handleSave = async () => {
    if (!newName.trim()) return;
    try {
      await updateProfile({ displayName: newName.trim() });
      setEditing(false);
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('profile.logoutTitle'),
      t('profile.logoutMessage'),
      [
        { text: t('profile.cancel'), style: 'cancel' },
        {
          text: t('profile.logoutConfirm'),
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  if (!user) return null;

  return (
    <View style={s.container}>
      <View style={s.avatarContainer}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>
            {user.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.label}>{t('profile.name')}</Text>
        {editing ? (
          <View style={s.editRow}>
            <TextInput
              style={s.editInput}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
              <Text style={s.saveBtnText}>✓</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => { setNewName(user.displayName); setEditing(true); }}>
            <Text style={s.value}>{user.displayName} ✏️</Text>
          </TouchableOpacity>
        )}

        <View style={s.divider} />

        <Text style={s.label}>{t('profile.phone')}</Text>
        <Text style={s.value}>{user.phone}</Text>

        <View style={s.divider} />

        <Text style={s.label}>{t('profile.memberSince')}</Text>
        <Text style={s.value}>
          {new Date(user.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <TouchableOpacity style={s.logoutButton} onPress={handleLogout}>
        <Text style={s.logoutButtonText}>{t('profile.logout')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: spacing.lg,
    },
    avatarContainer: {
      alignItems: 'center',
      marginVertical: spacing.xl,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: fontSize.xxl,
      fontWeight: 'bold',
      color: colors.background,
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
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: spacing.xs,
    },
    value: {
      fontSize: fontSize.lg,
      color: colors.text,
      fontWeight: '500',
    },
    divider: {
      height: 1,
      backgroundColor: colors.surfaceBorder,
      marginVertical: spacing.md,
    },
    editRow: {
      flexDirection: 'row',
      alignItems: 'center',
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
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    saveBtnText: {
      color: colors.background,
      fontSize: fontSize.lg,
      fontWeight: 'bold',
    },
    logoutButton: {
      marginTop: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 2,
      borderColor: colors.danger,
      alignItems: 'center',
    },
    logoutButtonText: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.danger,
    },
  });
