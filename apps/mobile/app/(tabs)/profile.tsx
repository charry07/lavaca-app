import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { spacing, borderRadius, fontSize, type ThemeColors } from '../../src/constants/theme';
import { useI18n } from '../../src/i18n';
import { useTheme } from '../../src/theme';
import { useAuth } from '../../src/auth';

export default function ProfileTab() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { user, logout, updateProfile } = useAuth();
  const router = useRouter();
  const s = createStyles(colors);

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const saveEdit = async () => {
    if (!editingField || !editValue.trim()) return;
    try {
      await updateProfile({ [editingField]: editValue.trim() });
      setEditingField(null);
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.error'), t('profile.permissionNeeded'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      // Store as data URI (for in-memory backend; in production would upload to cloud)
      const avatarUrl = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;
      try {
        await updateProfile({ avatarUrl });
      } catch (err: any) {
        Alert.alert(t('common.error'), err.message);
      }
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
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  if (!user) return null;

  const renderField = (
    label: string,
    field: string,
    value: string,
    editable: boolean = true
  ) => (
    <View key={field}>
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
          <TouchableOpacity style={s.saveBtn} onPress={saveEdit}>
            <Text style={s.saveBtnText}>✓</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.cancelBtn} onPress={cancelEdit}>
            <Text style={s.cancelBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => editable && startEdit(field, value)}
          disabled={!editable}
        >
          <Text style={s.value}>
            {value || '—'} {editable ? '✏️' : ''}
          </Text>
        </TouchableOpacity>
      )}
      <View style={s.divider} />
    </View>
  );

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scrollContent}>
      {/* Avatar */}
      <TouchableOpacity style={s.avatarContainer} onPress={handlePickImage}>
        {user.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={s.avatarImage} />
        ) : (
          <View style={s.avatar}>
            <Text style={s.avatarText}>
              {user.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={s.cameraIcon}>
          <Text style={s.cameraText}>📷</Text>
        </View>
      </TouchableOpacity>

      {/* User info card */}
      <View style={s.card}>
        {renderField(t('profile.name'), 'displayName', user.displayName)}
        {renderField(t('profile.username'), 'username', user.username || '', true)}
        {renderField(t('profile.phone'), 'phone', user.phone, false)}
        {renderField(t('profile.document'), 'documentId', user.documentId || '', true)}

        <Text style={s.label}>{t('profile.memberSince')}</Text>
        <Text style={s.value}>
          {new Date(user.createdAt).toLocaleDateString()}
        </Text>
      </View>

      {/* Logout */}
      <TouchableOpacity style={s.logoutButton} onPress={handleLogout}>
        <Text style={s.logoutButtonText}>{t('profile.logout')}</Text>
      </TouchableOpacity>
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
      paddingBottom: spacing.xxl,
    },
    avatarContainer: {
      alignItems: 'center',
      marginVertical: spacing.xl,
      position: 'relative',
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    avatarText: {
      fontSize: fontSize.hero,
      fontWeight: 'bold',
      color: colors.background,
    },
    cameraIcon: {
      position: 'absolute',
      bottom: 0,
      right: '35%',
      backgroundColor: colors.surface,
      borderRadius: 16,
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
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
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    saveBtnText: {
      color: colors.background,
      fontSize: fontSize.md,
      fontWeight: 'bold',
    },
    cancelBtn: {
      marginLeft: spacing.xs,
      backgroundColor: colors.danger,
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cancelBtnText: {
      color: colors.white,
      fontSize: fontSize.md,
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
