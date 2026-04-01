import { useState, useEffect, useCallback, useLayoutEffect } from 'react';
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
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { User } from '@lavaca/types';
import { spacing, borderRadius, fontSize, fontWeight, type ThemeColors } from '../../src/constants/theme';
import { GlassCard, SkeletonCard, ErrorState, useToast } from '../../src/components';
import { useI18n } from '../../src/i18n';
import { useTheme } from '../../src/theme';
import { useAuth } from '../../src/auth';
import { api } from '../../src/services/api';

import { getErrorMessage } from '../../src/utils/errorMessage';
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
  const { translate } = useI18n();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const { showError } = useToast();
  const styles = createStyles(colors);

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [repeatLoading, setRepeatLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerBackVisible: false,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) { router.back(); return; }
            router.replace('/(tabs)/groups');
          }}
          style={styles.headerBackButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.headerBackText}>←</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, router, styles.headerBackButton, styles.headerBackText]);

  const fetchGroup = useCallback(async () => {
    if (!id) return;
    try {
      const data = await api.getGroup(id);
      setGroup(data as GroupDetail);
      setFetchError(null);
    } catch (err: unknown) {
      setFetchError(getErrorMessage(err, translate('common.error')));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, translate]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  const handleRemoveMember = (member: GroupMember) => {
    if (!group) return;
    Alert.alert(
      translate('groups.removeMember'),
      translate('groups.removeMessage', { name: member.displayName }),
      [
        { text: translate('profile.cancel'), style: 'cancel' },
        {
          text: translate('groups.removeConfirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.removeGroupMember(group.id, member.id);
              fetchGroup();
            } catch (err: unknown) {
              Alert.alert(translate('common.error'), getErrorMessage(err));
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await api.searchUsers(searchQuery.trim());
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddMember = async (userToAdd: User) => {
    if (!group) return;
    setAddingId(userToAdd.id);
    try {
      await api.addGroupMembers(group.id, [userToAdd.id]);
      await fetchGroup();
      setSearchResults((prev) => prev.filter((u) => u.id !== userToAdd.id));
      Alert.alert('✅', translate('groups.memberAdded', { name: userToAdd.displayName }));
    } catch (err: unknown) {
      Alert.alert(translate('common.error'), getErrorMessage(err));
    } finally {
      setAddingId(null);
    }
  };

  const openAddModal = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowAddModal(true);
  };

  const handleRepeatSession = useCallback(async () => {
    if (!group || !user) return;
    setRepeatLoading(true);
    try {
      const history = await api.getUserHistory(user.id);
      const groupMemberIds = new Set(group.memberIds);
      const matched = history
        .filter(s => {
          const sessionUserIds = new Set(s.participants.map(p => p.userId));
          return [...groupMemberIds].every(id => sessionUserIds.has(id));
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      if (matched.length === 0) {
        showError(translate('groups.noHistory'));
        return;
      }

      const last = matched[0];
      const participantIds = last.participants
        .map(p => p.userId)
        .filter(pid => pid !== user.id)
        .join(',');

      router.push({
        pathname: '/create' as never,
        params: {
          prefillAmount: String(last.totalAmount),
          prefillCurrency: last.currency,
          prefillSplitMode: last.splitMode,
          prefillDescription: last.description || '',
          prefillParticipantIds: participantIds,
        },
      } as never);
    } catch (err: unknown) {
      showError(getErrorMessage(err, translate('common.error')));
    } finally {
      setRepeatLoading(false);
    }
  }, [group, user, translate, showError, router]);

  const isAdmin = group?.createdBy === user?.id;

  const renderMember = ({ item }: { item: GroupMember }) => {
    const isCreator = item.id === group?.createdBy;
    const isMe = item.id === user?.id;

    return (
      <GlassCard style={styles.memberCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.displayName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>
            {item.displayName}
            {isMe ? ' (yo)' : ''}
          </Text>
          <Text style={styles.memberUsername}>@{item.username}</Text>
        </View>
        {isCreator && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminText}>{translate('groups.admin')}</Text>
          </View>
        )}
        {isAdmin && !isCreator && (
          <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveMember(item)}>
            <Text style={styles.removeText}>✕</Text>
          </TouchableOpacity>
        )}
      </GlassCard>
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

  if (fetchError || !group) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ErrorState message={fetchError || translate('groups.groupNotFound')} onRetry={fetchGroup} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <GlassCard style={styles.header}>
        <LinearGradient
          colors={[colors.primary + '33', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.headerIcon}>{group.icon || '👥'}</Text>
        <Text style={styles.headerName}>{group.name}</Text>
        <Text style={styles.headerCount}>{group.members.length} {translate('groups.members')}</Text>
      </GlassCard>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={{ flex: 1, borderRadius: borderRadius.md, overflow: 'hidden' }}
          onPress={() => router.push('/create')}
        >
          <LinearGradient
            colors={[colors.primary, colors.accent || colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.createSessionBtn}
          >
            <Text style={styles.createSessionText}>{translate('groups.createSession')} 🐄</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addMemberBtn} onPress={openAddModal}>
          <Text style={styles.addMemberBtnText}>➕ {translate('groups.addMembers')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.repeatBtn, repeatLoading && { opacity: 0.5 }]}
          onPress={handleRepeatSession}
          disabled={repeatLoading}
        >
          {repeatLoading
            ? <ActivityIndicator size="small" color={colors.accent} />
            : <Text style={styles.repeatBtnText}>🔁 {translate('groups.repeatSession')}</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Add Member Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <GlassCard style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{translate('groups.addMembers')}</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder={translate('groups.searchPlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />

            {searching && (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
            )}
            {!searching && searchQuery.length < 2 && (
              <Text style={styles.searchHint}>{translate('groups.searchHint')}</Text>
            )}
            {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
              <Text style={styles.searchHint}>{translate('groups.noResults')}</Text>
            )}

            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item: searchUser }) => {
                const isMember = group?.memberIds.includes(searchUser.id);
                const isAdding = addingId === searchUser.id;
                return (
                  <View style={styles.searchResultCard}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{searchUser.displayName.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{searchUser.displayName}</Text>
                      <Text style={styles.memberUsername}>@{searchUser.username}</Text>
                    </View>
                    {isMember ? (
                      <View style={styles.alreadyBadge}>
                        <Text style={styles.alreadyText}>{translate('groups.alreadyMember')}</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => handleAddMember(searchUser)}
                        disabled={isAdding}
                      >
                        {isAdding ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.addBtnText}>{translate('groups.addButton')}</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                );
              }}
            />
          </GlassCard>
        </View>
      </Modal>

      <FlatList
        data={group.members}
        keyExtractor={(item) => item.id}
        renderItem={renderMember}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchGroup(); }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>{translate('groups.noMembers')}</Text>
        }
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { justifyContent: 'center', alignItems: 'center' },
    header: {
      margin: spacing.md,
      padding: spacing.xl,
      alignItems: 'center',
      borderRadius: borderRadius.xl,
      overflow: 'hidden',
    },
    headerIcon: { fontSize: 56, marginBottom: spacing.sm },
    headerName: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.black,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    repeatBtn: {
      borderWidth: 1,
      borderColor: colors.accent + '50',
      backgroundColor: colors.glass,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.md,
      alignItems: 'center',
    },
    repeatBtnText: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: colors.accent,
    },
    headerCount: { fontSize: fontSize.md, color: colors.textSecondary },
    actionsRow: {
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    createSessionBtn: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.md,
      alignItems: 'center',
    },
    createSessionText: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.bold,
      color: '#fff',
    },
    addMemberBtn: {
      backgroundColor: colors.glass,
      borderWidth: 1,
      borderColor: colors.primary,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.md,
      alignItems: 'center',
    },
    addMemberBtnText: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: colors.primary,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalContent: {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      padding: spacing.lg,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    modalTitle: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: colors.text,
    },
    modalClose: { fontSize: 22, color: colors.textMuted, padding: spacing.xs },
    searchInput: {
      backgroundColor: colors.glass,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: fontSize.md,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      marginBottom: spacing.sm,
    },
    searchHint: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
      textAlign: 'center',
      paddingVertical: spacing.lg,
    },
    searchResultCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.glassBorder,
    },
    alreadyBadge: {
      backgroundColor: colors.glassBorder,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: borderRadius.sm,
    },
    alreadyText: { fontSize: fontSize.xs, color: colors.textMuted },
    addBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: borderRadius.sm,
      minWidth: 70,
      alignItems: 'center',
    },
    addBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: '#fff' },
    list: { padding: spacing.md, paddingBottom: spacing.xxl },
    memberCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderRadius: borderRadius.md,
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
      fontWeight: fontWeight.bold,
      color: colors.primary,
    },
    memberInfo: { flex: 1 },
    memberName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
    memberUsername: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
    adminBadge: {
      backgroundColor: colors.accent + '22',
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: borderRadius.sm,
    },
    adminText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.accent },
    removeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.danger + '22',
      justifyContent: 'center',
      alignItems: 'center',
    },
    removeText: { fontSize: fontSize.md, color: colors.danger, fontWeight: fontWeight.bold },
    emptyText: {
      fontSize: fontSize.md,
      color: colors.textMuted,
      textAlign: 'center',
      padding: spacing.xl,
    },
    headerBackButton: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerBackText: {
      fontSize: 26,
      lineHeight: 28,
      color: colors.primary,
      fontWeight: fontWeight.bold,
    },
  });
