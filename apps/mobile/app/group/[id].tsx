import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { spacing, borderRadius, fontSize, type ThemeColors } from '../../src/constants/theme';
import { useI18n } from '../../src/i18n';
import { useTheme } from '../../src/theme';
import { useAuth } from '../../src/auth';
import { api } from '../../src/services/api';

interface GroupMember {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  phone: string;
}

interface GroupDetail {
  id: string;
  name: string;
  icon?: string;
  memberIds: string[];
  createdBy: string;
  createdAt: Date;
  members: GroupMember[];
}

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const s = createStyles(colors);

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGroup = useCallback(async () => {
    if (!id) return;
    try {
      const data = await api.getGroup(id);
      setGroup(data as GroupDetail);
    } catch (err) {
      console.error('Error fetching group:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  const handleRemoveMember = (member: GroupMember) => {
    if (!group) return;
    Alert.alert(
      t('groups.removeMember'),
      t('groups.removeMessage', { name: member.displayName }),
      [
        { text: t('profile.cancel'), style: 'cancel' },
        {
          text: t('groups.removeConfirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.removeGroupMember(group.id, member.id);
              fetchGroup();
            } catch (err: any) {
              Alert.alert(t('common.error'), err.message);
            }
          },
        },
      ]
    );
  };

  const handleCreateSession = () => {
    // Navigate to create screen — in the future we can pre-fill with group members
    router.push('/create');
  };

  const isAdmin = group?.createdBy === user?.id;

  const renderMember = ({ item }: { item: GroupMember }) => {
    const isCreator = item.id === group?.createdBy;
    const isMe = item.id === user?.id;

    return (
      <View style={s.memberCard}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>
            {item.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={s.memberInfo}>
          <Text style={s.memberName}>
            {item.displayName}
            {isMe ? ' (yo)' : ''}
          </Text>
          <Text style={s.memberUsername}>@{item.username}</Text>
        </View>
        {isCreator && (
          <View style={s.adminBadge}>
            <Text style={s.adminText}>{t('groups.admin')}</Text>
          </View>
        )}
        {isAdmin && !isCreator && (
          <TouchableOpacity
            style={s.removeButton}
            onPress={() => handleRemoveMember(item)}
          >
            <Text style={s.removeText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={s.centered}>
        <Text style={s.emptyText}>{t('groups.groupNotFound')}</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerIcon}>{group.icon || '👥'}</Text>
        <Text style={s.headerName}>{group.name}</Text>
        <Text style={s.headerCount}>
          {group.members.length} {t('groups.members')}
        </Text>
      </View>

      <TouchableOpacity style={s.createSessionBtn} onPress={handleCreateSession}>
        <Text style={s.createSessionText}>{t('groups.createSession')} 🐄</Text>
      </TouchableOpacity>

      <FlatList
        data={group.members}
        keyExtractor={(item) => item.id}
        renderItem={renderMember}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchGroup();
            }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <Text style={s.emptyText}>{t('groups.noMembers')}</Text>
        }
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    header: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceBorder,
    },
    headerIcon: { fontSize: 56, marginBottom: spacing.sm },
    headerName: {
      fontSize: fontSize.xl,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    headerCount: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
    },
    createSessionBtn: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.md,
      margin: spacing.md,
      alignItems: 'center',
    },
    createSessionText: {
      fontSize: fontSize.md,
      fontWeight: '700',
      color: colors.background,
    },
    list: { padding: spacing.md },
    memberCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary + '33',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    avatarText: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: colors.primary,
    },
    memberInfo: { flex: 1 },
    memberName: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.text,
    },
    memberUsername: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
      marginTop: 2,
    },
    adminBadge: {
      backgroundColor: colors.accent + '22',
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: borderRadius.sm,
    },
    adminText: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      color: colors.accent,
    },
    removeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.danger + '22',
      justifyContent: 'center',
      alignItems: 'center',
    },
    removeText: {
      fontSize: fontSize.md,
      color: colors.danger,
      fontWeight: '700',
    },
    emptyText: {
      fontSize: fontSize.md,
      color: colors.textMuted,
      textAlign: 'center',
      padding: spacing.xl,
    },
  });
