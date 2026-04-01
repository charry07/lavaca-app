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
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { spacing, borderRadius, fontSize, fontWeight, type ThemeColors } from '../../src/constants/theme';
import { GlassCard, SkeletonCard, EmptyState, useToast } from '../../src/components';
import { useI18n } from '../../src/i18n';
import { useTheme } from '../../src/theme';
import { useAuth } from '../../src/auth';
import { api } from '../../src/services/api';

import { getErrorMessage } from '../../src/utils/errorMessage';
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
function nameToAccent(name: string, colors: ThemeColors): string {
  const accents = [
    colors.eventSessionClosed,
    colors.eventFastPayer,
    colors.eventRouletteCoward,
    colors.eventRouletteWin,
    colors.eventDebtReminder,
    colors.primary,
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return accents[Math.abs(hash) % accents.length];
}

export default function GroupsTab() {
  const { translate } = useI18n();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { showError } = useToast();
  const styles = createStyles(colors);

  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupIcon, setNewGroupIcon] = useState<keyof typeof Feather.glyphMap>('users');
  const [creating, setCreating] = useState(false);

  const ICONS: (keyof typeof Feather.glyphMap)[] = ['users', 'home', 'coffee', 'star', 'briefcase', 'activity', 'target', 'book-open', 'truck', 'send'];

  const LEGACY_ICON_MAP: Record<string, keyof typeof Feather.glyphMap> = {
    '👥': 'users',
    '🏠': 'home',
    '🍕': 'coffee',
    '🎉': 'star',
    '💼': 'briefcase',
    '🏋️': 'activity',
    '⚽': 'target',
    '🎓': 'book-open',
    '🍺': 'truck',
    '✈️': 'send',
  };

  const resolveGroupIcon = (icon?: string): keyof typeof Feather.glyphMap => {
    if (!icon) return 'users';
    if (icon in Feather.glyphMap) return icon as keyof typeof Feather.glyphMap;
    return LEGACY_ICON_MAP[icon] || 'users';
  };

  const fetchGroups = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.getUserGroups(user.id);
      setGroups(data);
    } catch {
      showError(translate('common.error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showError, translate, user]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleCreate = async () => {
    if (!newGroupName.trim()) {
      Alert.alert(translate('common.error'), translate('groups.noName'));
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
      setNewGroupIcon('users');
      fetchGroups();
    } catch (err: unknown) {
      showError(getErrorMessage(err, translate('create.errorCreating')));
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    Alert.alert(
      translate('groups.deleteTitle'),
      translate('groups.deleteMessage', { name: groupName }),
      [
        { text: translate('profile.cancel'), style: 'cancel' },
        {
          text: translate('groups.deleteConfirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteGroup(groupId);
              fetchGroups();
            } catch (err: unknown) {
              showError(getErrorMessage(err, translate('common.error')));
            }
          },
        },
      ]
    );
  };

  const renderGroup = ({ item }: { item: GroupWithMembers }) => {
    const accent = nameToAccent(item.name, colors);
    return (
      <TouchableOpacity
        onPress={() => router.push(`/group/${item.id}` as any)}
        activeOpacity={0.7}
      >
        <GlassCard style={styles.groupCard}>
          {/* Left accent strip */}
          <View style={[styles.accentStrip, { backgroundColor: accent }]} />
          <View style={styles.groupIconWrap}>
            <Feather name={resolveGroupIcon(item.icon)} size={20} color={colors.accent} />
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{item.name}</Text>
            <Text style={styles.groupMembers}>
              {item.members.length} {translate('groups.members')}
            </Text>
            <Text style={styles.groupMemberNames} numberOfLines={1}>
              {item.members.map((m) => m.displayName).join(', ')}
            </Text>
            {/* Mini member avatar row */}
            <View style={styles.memberAvatarRow}>
              {item.members.slice(0, 3).map((m, i) => (
                <View key={m.id} style={[styles.miniAvatar, { marginLeft: i === 0 ? 0 : -6 }]}>
                  <Text style={styles.miniAvatarText}>{m.displayName.charAt(0).toUpperCase()}</Text>
                </View>
              ))}
              {item.members.length > 3 && (
                <View style={[styles.miniAvatar, { marginLeft: -6, backgroundColor: colors.surface }]}>
                  <Text style={styles.miniAvatarText}>+{item.members.length - 3}</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDeleteGroup(item.id, item.name)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole='button'
            accessibilityLabel={translate('groups.deleteTitle')}
          >
            <Feather name='trash-2' size={16} color={colors.danger} />
          </TouchableOpacity>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={{ padding: spacing.md, gap: spacing.md }}>
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {groups.length === 0 ? (
        <View style={styles.emptyWrapper}>
          <EmptyState
            iconName='users'
            title={translate('groups.empty')}
            hint={translate('groups.emptyHint')}
            action={{ label: translate('groups.createButton'), onPress: () => setShowCreate(true) }}
          />
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroup}
          contentContainerStyle={styles.list}
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
      <TouchableOpacity style={styles.fab} onPress={() => setShowCreate(true)} activeOpacity={0.85}>
        <LinearGradient
          colors={[colors.primary, colors.accent || colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Text style={styles.fabText}>+</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Create Group Modal */}
      <Modal visible={showCreate} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <GlassCard style={styles.modalContent}>
            <Text style={styles.modalTitle}>{translate('groups.createTitle')}</Text>

            <Text style={styles.fieldLabel}>{translate('groups.nameLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder={translate('groups.namePlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={newGroupName}
              onChangeText={setNewGroupName}
              autoFocus
            />

            <Text style={styles.fieldLabel}>{translate('groups.iconLabel')}</Text>
            <View style={styles.iconPicker}>
              {ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[styles.iconOption, newGroupIcon === icon && styles.iconSelected]}
                  onPress={() => setNewGroupIcon(icon)}
                >
                  <Feather name={icon} size={18} color={newGroupIcon === icon ? colors.primary : colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowCreate(false)}>
                <Text style={styles.cancelButtonText}>{translate('profile.cancel')}</Text>
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
                  style={styles.createButton}
                >
                  {creating ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={styles.createButtonText}>{translate('groups.createButton')}</Text>
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
    groupIconWrap: {
      width: 46,
      height: 46,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    groupInfo: { flex: 1 },
    groupName: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
    groupMembers: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
    groupMemberNames: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
    memberAvatarRow: {
      flexDirection: 'row',
      marginTop: spacing.xs,
    },
    miniAvatar: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.accent + '30',
      borderWidth: 1,
      borderColor: colors.surface2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    miniAvatarText: {
      fontSize: 9,
      fontWeight: fontWeight.bold,
      color: colors.accent,
    },
    deleteBtn: { padding: spacing.sm, marginLeft: spacing.sm },
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
    fabText: { fontSize: 28, fontWeight: fontWeight.bold, color: colors.white, marginTop: -2 },
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
      color: colors.white,
    },
  });
