import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { spacing, borderRadius, fontSize, type ThemeColors } from '../../src/constants/theme';
import { useI18n } from '../../src/i18n';
import { useTheme } from '../../src/theme';
import { useAuth } from '../../src/auth';
import { api } from '../../src/services/api';

interface GroupWithMembers {
  id: string;
  name: string;
  icon?: string;
  memberIds: string[];
  createdBy: string;
  createdAt: Date;
  members: { id: string; displayName: string; username: string; avatarUrl?: string }[];
}

export default function GroupsTab() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const s = createStyles(colors);

  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupIcon, setNewGroupIcon] = useState('👥');
  const [creating, setCreating] = useState(false);

  const ICONS = ['👥', '🏠', '🍕', '🎉', '💼', '🏋️', '⚽', '🎓', '🍺', '✈️'];

  const fetchGroups = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.getUserGroups(user.id);
      setGroups(data);
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleCreate = async () => {
    if (!newGroupName.trim()) {
      Alert.alert(t('common.error'), t('groups.noName'));
      return;
    }
    if (!user) return;

    setCreating(true);
    try {
      await api.createGroup({
        name: newGroupName.trim(),
        icon: newGroupIcon,
        createdBy: user.id,
      });
      setShowCreate(false);
      setNewGroupName('');
      setNewGroupIcon('👥');
      fetchGroups();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    Alert.alert(
      t('groups.deleteTitle'),
      t('groups.deleteMessage', { name: groupName }),
      [
        { text: t('profile.cancel'), style: 'cancel' },
        {
          text: t('groups.deleteConfirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteGroup(groupId);
              fetchGroups();
            } catch (err: any) {
              Alert.alert(t('common.error'), err.message);
            }
          },
        },
      ]
    );
  };

  const renderGroup = ({ item }: { item: GroupWithMembers }) => (
    <TouchableOpacity
      style={s.groupCard}
      onPress={() => router.push(`/group/${item.id}` as any)}
      onLongPress={() => handleDeleteGroup(item.id, item.name)}
    >
      <Text style={s.groupIcon}>{item.icon || '👥'}</Text>
      <View style={s.groupInfo}>
        <Text style={s.groupName}>{item.name}</Text>
        <Text style={s.groupMembers}>
          {item.members.length} {t('groups.members')}
        </Text>
        <Text style={s.groupMemberNames} numberOfLines={1}>
          {item.members.map((m) => m.displayName).join(', ')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {groups.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>👥</Text>
          <Text style={s.emptyText}>{t('groups.empty')}</Text>
          <Text style={s.emptyHint}>{t('groups.emptyHint')}</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroup}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchGroups(); }}
              tintColor={colors.primary}
            />
          }
        />
      )}

      <TouchableOpacity style={s.fab} onPress={() => setShowCreate(true)}>
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={showCreate} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>{t('groups.createTitle')}</Text>

            <Text style={s.fieldLabel}>{t('groups.nameLabel')}</Text>
            <TextInput
              style={s.input}
              placeholder={t('groups.namePlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={newGroupName}
              onChangeText={setNewGroupName}
              autoFocus
            />

            <Text style={s.fieldLabel}>{t('groups.iconLabel')}</Text>
            <View style={s.iconPicker}>
              {ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[s.iconOption, newGroupIcon === icon && s.iconSelected]}
                  onPress={() => setNewGroupIcon(icon)}
                >
                  <Text style={s.iconText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.modalButtons}>
              <TouchableOpacity
                style={s.cancelButton}
                onPress={() => setShowCreate(false)}
              >
                <Text style={s.cancelButtonText}>{t('profile.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.createButton, creating && s.buttonDisabled]}
                onPress={handleCreate}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <Text style={s.createButtonText}>{t('groups.createButton')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
    emptyIcon: { fontSize: 64, marginBottom: spacing.md },
    emptyText: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
    emptyHint: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center' },
    list: { padding: spacing.md },
    groupCard: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      alignItems: 'center',
    },
    groupIcon: { fontSize: 40, marginRight: spacing.md },
    groupInfo: { flex: 1 },
    groupName: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
    groupMembers: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
    groupMemberNames: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
    fab: {
      position: 'absolute',
      bottom: spacing.xl,
      right: spacing.xl,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    fabText: { fontSize: 28, fontWeight: '700', color: colors.background, marginTop: -2 },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      padding: spacing.xl,
      paddingBottom: spacing.xxl,
    },
    modalTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
    fieldLabel: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.textSecondary,
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
      marginBottom: spacing.sm,
    },
    iconPicker: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginVertical: spacing.sm,
    },
    iconOption: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.sm,
      marginBottom: spacing.sm,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    iconSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '22',
    },
    iconText: { fontSize: 22 },
    modalButtons: {
      flexDirection: 'row',
      marginTop: spacing.lg,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: spacing.md,
      alignItems: 'center',
      borderRadius: borderRadius.md,
      backgroundColor: colors.surface,
      marginRight: spacing.sm,
    },
    cancelButtonText: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
    createButton: {
      flex: 1,
      paddingVertical: spacing.md,
      alignItems: 'center',
      borderRadius: borderRadius.md,
      backgroundColor: colors.primary,
      marginLeft: spacing.sm,
    },
    createButtonText: { fontSize: fontSize.md, fontWeight: '700', color: colors.background },
    buttonDisabled: { opacity: 0.6 },
  });
