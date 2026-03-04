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
import { User } from '@lavaca/shared';
import { spacing, borderRadius, fontSize, fontWeight, type ThemeColors } from '../../src/constants/theme';
import { GlassCard, SkeletonCard, ErrorState } from '../../src/components';
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
  const navigation = useNavigation();
  const s = createStyles(colors);

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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
          style={s.headerBackButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={s.headerBackText}>←</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, router, s.headerBackButton, s.headerBackText]);

  const fetchGroup = useCallback(async () => {
    if (!id) return;
    try {
      const data = await api.getGroup(id);
      setGroup(data as GroupDetail);
      setFetchError(null);
    } catch (err: any) {
      setFetchError(err.message || t('common.error'));
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
      Alert.alert('✅', t('groups.memberAdded', { name: userToAdd.displayName }));
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setAddingId(null);
    }
  };

  const openAddModal = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowAddModal(true);
  };

  const isAdmin = group?.createdBy === user?.id;

  const renderMember = ({ item }: { item: GroupMember }) => {
    const isCreator = item.id === group?.createdBy;
    const isMe = item.id === user?.id;

    return (
      <GlassCard style={s.memberCard}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{item.displayName.charAt(0).toUpperCase()}</Text>
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
          <TouchableOpacity style={s.removeButton} onPress={() => handleRemoveMember(item)}>
            <Text style={s.removeText}>✕</Text>
          </TouchableOpacity>
        )}
      </GlassCard>
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

  if (fetchError || !group) {
    return (
      <View style={[s.container, s.centered]}>
        <ErrorState message={fetchError || t('groups.groupNotFound')} onRetry={fetchGroup} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <GlassCard style={s.header}>
        <LinearGradient
          colors={[colors.primary + '33', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={s.headerIcon}>{group.icon || '👥'}</Text>
        <Text style={s.headerName}>{group.name}</Text>
        <Text style={s.headerCount}>{group.members.length} {t('groups.members')}</Text>
      </GlassCard>

      {/* Actions */}
      <View style={s.actionsRow}>
        <TouchableOpacity
          style={{ flex: 1, borderRadius: borderRadius.md, overflow: 'hidden' }}
          onPress={() => router.push('/create')}
        >
          <LinearGradient
            colors={[colors.primary, colors.accent || colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.createSessionBtn}
          >
            <Text style={s.createSessionText}>{t('groups.createSession')} 🐄</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={s.addMemberBtn} onPress={openAddModal}>
          <Text style={s.addMemberBtnText}>➕ {t('groups.addMembers')}</Text>
        </TouchableOpacity>
      </View>

      {/* Add Member Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={[s.modalOverlay, { backgroundColor: colors.overlay }]}>
          <GlassCard style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{t('groups.addMembers')}</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={s.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={s.searchInput}
              placeholder={t('groups.searchPlaceholder')}
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
              <Text style={s.searchHint}>{t('groups.searchHint')}</Text>
            )}
            {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
              <Text style={s.searchHint}>{t('groups.noResults')}</Text>
            )}

            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item: searchUser }) => {
                const isMember = group?.memberIds.includes(searchUser.id);
                const isAdding = addingId === searchUser.id;
                return (
                  <View style={s.searchResultCard}>
                    <View style={s.avatar}>
                      <Text style={s.avatarText}>{searchUser.displayName.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={s.memberInfo}>
                      <Text style={s.memberName}>{searchUser.displayName}</Text>
                      <Text style={s.memberUsername}>@{searchUser.username}</Text>
                    </View>
                    {isMember ? (
                      <View style={s.alreadyBadge}>
                        <Text style={s.alreadyText}>{t('groups.alreadyMember')}</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={s.addBtn}
                        onPress={() => handleAddMember(searchUser)}
                        disabled={isAdding}
                      >
                        {isAdding ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={s.addBtnText}>{t('groups.addButton')}</Text>
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
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchGroup(); }}
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
      fontWeight: fontWeight.bold,
      color: colors.text,
      marginBottom: spacing.xs,
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
