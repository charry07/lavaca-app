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
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { spacing, borderRadius, fontSize, fontWeight, type ThemeColors } from '../../src/constants/theme';
import { GlassCard, SkeletonCard, EmptyState } from '../../src/components';
import { useI18n } from '../../src/i18n';
import { useTheme } from '../../src/theme';
import { useAuth } from '../../src/auth';
import { api } from '../../src/services/api';
import { useToast } from '../../src/components/Toast';

interface GroupWithMembers {
  id: string;
  name: string;
  icon?: string;
  memberIds: string[];
  createdBy: string;
  createdAt: Date;
  members: { id: string; displayName: string; username: string; avatarUrl?: string }[];
}

// Deterministic accent color from group name for the left strip
function nameToAccent(name: string): string {
  const ACCENTS = ['#4ade80', '#60a5fa', '#f59e0b', '#a78bfa', '#f472b6', '#34d399'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return ACCENTS[Math.abs(hash) % ACCENTS.length];
}

export default function GroupsTab() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { showError } = useToast();
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
    } catch {
      showError(t('common.error'));
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
      showError(err.message || t('create.errorCreating'));
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
              showError(err.message || t('common.error'));
            }
          },
        },
      ]
    );
  };

  const renderGroup = ({ item }: { item: GroupWithMembers }) => {
    const accent = nameToAccent(item.name);
    return (
      <TouchableOpacity
        onPress={() => router.push(`/group/${item.id}` as any)}
        activeOpacity={0.7}
      >
        <GlassCard style={s.groupCard}>
          {/* Left accent strip */}
          <View style={[s.accentStrip, { backgroundColor: accent }]} />
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
          <TouchableOpacity
            style={s.deleteBtn}
            onPress={() => handleDeleteGroup(item.id, item.name)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={s.deleteBtnText}>🗑️</Text>
          </TouchableOpacity>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={s.container}>
        <View style={{ padding: spacing.md, gap: spacing.md }}>
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {groups.length === 0 ? (
        <View style={s.emptyWrapper}>
          <EmptyState
            emoji="👥"
            title={t('groups.empty')}
            hint={t('groups.emptyHint')}
            action={{ label: t('groups.createButton'), onPress: () => setShowCreate(true) }}
          />
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

      {/* Gradient FAB */}
      <TouchableOpacity style={s.fab} onPress={() => setShowCreate(true)} activeOpacity={0.85}>
        <LinearGradient
          colors={[colors.primary, colors.accent || colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.fabGradient}
        >
          <Text style={s.fabText}>+</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Create Group Modal */}
      <Modal visible={showCreate} transparent animationType="slide">
        <View style={[s.modalOverlay, { backgroundColor: colors.overlay }]}>
          <GlassCard style={s.modalContent}>
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
              <TouchableOpacity style={s.cancelButton} onPress={() => setShowCreate(false)}>
                <Text style={s.cancelButtonText}>{t('profile.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, borderRadius: borderRadius.md, overflow: 'hidden', opacity: creating ? 0.6 : 1 }}
                onPress={handleCreate}
                disabled={creating}
              >
                <LinearGradient
                  colors={[colors.primary, colors.accent || colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.createButton}
                >
                  {creating ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={s.createButtonText}>{t('groups.createButton')}</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    emptyWrapper: { flex: 1, justifyContent: 'center', padding: spacing.xl },
    list: { padding: spacing.md, paddingBottom: 100 },
    groupCard: {
      flexDirection: 'row',
      padding: spacing.md,
      marginBottom: spacing.sm,
      alignItems: 'center',
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
    },
    accentStrip: {
      width: 4,
      alignSelf: 'stretch',
      borderRadius: 2,
      marginRight: spacing.md,
    },
    groupIcon: { fontSize: 36, marginRight: spacing.md },
    groupInfo: { flex: 1 },
    groupName: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
    groupMembers: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
    groupMemberNames: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
    deleteBtn: { padding: spacing.sm, marginLeft: spacing.sm },
    deleteBtnText: { fontSize: 20 },
    fab: {
      position: 'absolute',
      bottom: spacing.xl,
      right: spacing.xl,
      width: 56,
      height: 56,
      borderRadius: 28,
      overflow: 'hidden',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8,
    },
    fabGradient: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    fabText: { fontSize: 28, fontWeight: fontWeight.bold, color: '#fff', marginTop: -2 },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalContent: {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      padding: spacing.xl,
      paddingBottom: spacing.xxl,
    },
    modalTitle: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: colors.text,
      marginBottom: spacing.lg,
    },
    fieldLabel: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: colors.textSecondary,
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
      backgroundColor: colors.glass,
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
      gap: spacing.sm,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: spacing.md,
      alignItems: 'center',
      borderRadius: borderRadius.md,
      backgroundColor: colors.glass,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    cancelButtonText: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: colors.text,
    },
    createButton: {
      paddingVertical: spacing.md,
      alignItems: 'center',
      borderRadius: borderRadius.md,
    },
    createButtonText: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.bold,
      color: '#fff',
    },
  });
