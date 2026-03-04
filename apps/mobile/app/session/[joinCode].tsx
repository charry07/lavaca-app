import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  Share,
  RefreshControl,
  Modal,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PaymentSession, Participant, User, formatCOP } from '@lavaca/shared';
import { api } from '../../src/services/api';
import { spacing, borderRadius, fontSize, fontWeight, type ThemeColors } from '../../src/constants/theme';
import { SkeletonCard, ErrorState } from '../../src/components';
import { RouletteWheel } from '../../src/components/RouletteWheel';
import { QRCode } from '../../src/components/QRCode';
import { useI18n } from '../../src/i18n';
import { useTheme } from '../../src/theme';
import { useAuth } from '../../src/auth';
import { useToast } from '../../src/components/Toast';
import { useSessionSocket } from '../../src/hooks/useSessionSocket';

export default function SessionScreen() {
  const { joinCode } = useLocalSearchParams<{ joinCode: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const s = createStyles(colors);

  const [session, setSession] = useState<PaymentSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [splitting, setSplitting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showRoulette, setShowRoulette] = useState(false);
  const [rouletteWinner, setRouletteWinner] = useState(-1);
  const [pendingUpdate, setPendingUpdate] = useState<PaymentSession | null>(null);
  const [canCloseRoulette, setCanCloseRoulette] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [participantSearchQuery, setParticipantSearchQuery] = useState('');
  const [participantResults, setParticipantResults] = useState<User[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [addingParticipantId, setAddingParticipantId] = useState<string | null>(null);

  // Animated progress bar width
  const progressAnim = useRef(new Animated.Value(0)).current;

  const fetchSession = useCallback(async () => {
    if (!joinCode) return;
    try {
      const data = await api.getSession(joinCode);
      setSession(data);
      setFetchError(null);
    } catch (err: any) {
      setFetchError(err.message || t('common.error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [joinCode]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Real-time updates via Socket.IO (replaces 3-second polling)
  const handleSocketUpdate = useCallback((updated: PaymentSession) => {
    setSession(updated);
  }, []);
  useSessionSocket(joinCode, handleSocketUpdate);

  // Animate progress bar whenever paid count changes
  useEffect(() => {
    if (!session) return;
    const owedParticipants = session.participants.filter((p) => p.amount > 0);
    const paidCount = owedParticipants.filter((p) => p.status === 'confirmed').length;
    const totalCount = owedParticipants.length || session.participants.length;
    const pct = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;

    Animated.spring(progressAnim, {
      toValue: pct,
      useNativeDriver: false,
      friction: 8,
    }).start();
  }, [session]);

  useEffect(() => {
    if (!showAddParticipantModal) return;

    const query = participantSearchQuery.trim();
    if (query.length < 2) {
      setParticipantResults([]);
      setSearchingUsers(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const results = await api.searchUsers(query);
        setParticipantResults(results);
      } catch {
        setParticipantResults([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [participantSearchQuery, showAddParticipantModal]);

  const handleSplit = async () => {
    if (!joinCode || !session) return;
    setSplitting(true);
    try {
      const updated = await api.splitSession(joinCode);

      if (session.splitMode === 'roulette' && updated.participants.length > 1) {
        const winnerIdx = updated.participants.findIndex((p) => p.isRouletteWinner);
        if (winnerIdx >= 0) {
          setRouletteWinner(winnerIdx);
          setPendingUpdate(updated);
          setCanCloseRoulette(false);
          setShowRoulette(true);
          setSplitting(false);
          return;
        }
      }

      setSession(updated);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSplitting(false);
    }
  };

  const handleRouletteFinish = () => {
    if (pendingUpdate) {
      setSession(pendingUpdate);
      setPendingUpdate(null);
    }
    setCanCloseRoulette(true);
  };

  const handleCloseRouletteModal = () => {
    if (!canCloseRoulette) return;
    setShowRoulette(false);
  };

  const getShareLink = () => {
    if (Platform.OS === 'web') {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://lavaca.app';
      return `${origin}/join?code=${joinCode}`;
    }
    return `https://lavaca.app/join?code=${joinCode}`;
  };

  const handleTextShare = async () => {
    if (!joinCode) return;
    const link = getShareLink();
    try {
      await Share.share({
        message: t('session.shareMessage', { code: joinCode }),
        url: link,
      });
    } catch {}
  };

  const handleCopyLink = async () => {
    const link = getShareLink();
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(link);
      showSuccess(t('session.copied'));
    } else {
      await Share.share({ message: link });
    }
  };

  const handleReportPaid = async (userId: string) => {
    if (!joinCode || !user) return;
    try {
      const updated = await api.reportPaid(joinCode, {
        userId,
        reporterId: user.id,
        paymentMethod: 'nequi',
      });
      setSession(updated);
      showSuccess(t('session.reportedPaid'));
    } catch (err: any) {
      showError(err.message || t('common.error'));
    }
  };

  const handleApprovePaid = async (userId: string) => {
    if (!joinCode) return;
    try {
      const updated = await api.approvePaid(joinCode, {
        userId,
        adminId: session?.adminId || '',
        paymentMethod: 'nequi',
      });
      setSession(updated);
      showSuccess(t('session.paymentApproved'));
    } catch (err: any) {
      showError(err.message || t('common.error'));
    }
  };

  const handleCopyCode = async () => {
    if (!joinCode) return;
    try {
      if (Platform.OS === 'web' && navigator?.clipboard) {
        await navigator.clipboard.writeText(joinCode);
      } else {
        await Share.share({ message: joinCode });
        return;
      }
      showSuccess(t('session.codeCopied'));
    } catch {}
  };

  const handleCloseSession = () => {
    if (!joinCode || !session) return;
    if (session.status !== 'open') {
      showError(t('session.closeNotOpen'));
      return;
    }

    const owedPendingCount = session.participants.filter((p) => p.amount > 0 && p.status !== 'confirmed').length;
    const msg = owedPendingCount > 0
      ? t('session.closeConfirmPending', { count: owedPendingCount })
      : t('session.closeConfirmMsg');

    const confirmClose = async () => {
      setClosing(true);
      try {
        const updated = await api.closeSession(joinCode);
        if (updated.status !== 'closed') {
          showError(t('session.closeFailed'));
          return;
        }
        setSession(updated);
        showSuccess(t('session.closedSuccess'));
        fetchSession();
      } catch (err: any) {
        showError(err.message || t('common.error'));
      } finally {
        setClosing(false);
      }
    };

    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' ? window.confirm(msg) : true;
      if (ok) confirmClose();
      return;
    }

    Alert.alert(
      t('session.closeConfirmTitle'),
      msg,
      [
        { text: t('profile.cancel'), style: 'cancel' },
        { text: t('session.closeConfirmBtn'), style: 'destructive', onPress: confirmClose },
      ]
    );
  };

  const handleDeleteSession = () => {
    if (!joinCode || !session) return;
    if (user?.id !== session.adminId) {
      showError(t('session.deleteNotAdmin'));
      return;
    }

    const msg = t('session.deleteConfirmMsg');
    const confirmDelete = async () => {
      setDeleting(true);
      try {
        await api.deleteSession(joinCode, { adminId: session.adminId });
        showSuccess(t('session.deleteSuccess'));
        router.replace('/(tabs)');
      } catch (err: any) {
        showError(err.message || t('session.deleteError'));
      } finally {
        setDeleting(false);
      }
    };

    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' ? window.confirm(msg) : true;
      if (ok) confirmDelete();
      return;
    }

    Alert.alert(
      t('session.deleteConfirmTitle'),
      msg,
      [
        { text: t('profile.cancel'), style: 'cancel' },
        { text: t('session.deleteConfirmBtn'), style: 'destructive', onPress: confirmDelete },
      ]
    );
  };

  const openAddParticipantModal = () => {
    setParticipantSearchQuery('');
    setParticipantResults([]);
    setSearchingUsers(false);
    setShowAddParticipantModal(true);
  };

  const handleAddParticipant = async (userToAdd: User) => {
    if (!joinCode) return;
    setAddingParticipantId(userToAdd.id);
    try {
      const updated = await api.joinSession(joinCode, {
        userId: userToAdd.id,
        displayName: userToAdd.displayName,
      });
      setSession(updated);
      setParticipantResults((prev) => prev.filter((u) => u.id !== userToAdd.id));
      showSuccess(t('session.memberAdded', { name: userToAdd.displayName }));
    } catch (err: any) {
      showError(err.message || t('common.error'));
    } finally {
      setAddingParticipantId(null);
    }
  };

  // ── Loading state ──────────────────────────────────────
  if (loading) {
    return (
      <View style={s.container}>
        <View style={s.skeletonContainer}>
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </View>
      </View>
    );
  }

  // ── Error / not found ──────────────────────────────────
  if (fetchError || !session) {
    return (
      <View style={[s.container, s.center]}>
        <ErrorState message={fetchError || t('session.notFound')} onRetry={fetchSession} />
      </View>
    );
  }

  const owedParticipants = session.participants.filter((p) => p.amount > 0);
  const paidCount = owedParticipants.filter((p) => p.status === 'confirmed').length;
  const totalCount = session.participants.length;
  const owedCount = owedParticipants.length;
  const displayPaidCount = owedCount === 0 ? totalCount : paidCount;
  const displayTotalCount = owedCount === 0 ? totalCount : owedCount;
  const allSplit = session.participants.some((p) => p.amount > 0);
  const isAdmin = user?.id === session.adminId;
  const canAddParticipants = session.status === 'open' && isAdmin;
  const pendingApprovalsCount = session.participants.filter((p) => p.status === 'reported').length;

  const getModeLabel = () => {
    switch (session.splitMode) {
      case 'equal': return t('session.equalMode');
      case 'percentage': return t('session.percentageMode');
      case 'roulette': return t('session.rouletteMode');
    }
  };

  const splitActionLabel = session.splitMode === 'roulette'
    ? t('session.spinRouletteButton')
    : t('session.splitButton');

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'open': return { color: colors.statusOpen, bg: colors.statusOpenBg };
      case 'closed': return { color: colors.statusClosed, bg: colors.statusClosedBg };
      default: return { color: colors.statusCancelled, bg: colors.statusCancelledBg };
    }
  };

  const renderParticipant = ({ item }: { item: Participant }) => {
    const isPaid = item.status === 'confirmed';
    const isReported = item.status === 'reported';
    const isMe = user?.id === item.userId;
    const isWinner = item.isRouletteWinner;
    const isCoward = item.isRouletteCoward;
    const isNoPay = item.amount <= 0;

    const statusLabel = isNoPay
      ? t('session.noPay')
      : isPaid
        ? t('session.paid')
        : isReported
          ? t('session.pendingApproval')
          : t('session.pending');

    // Left-border accent — the signature element (like flagging a bill)
    const accentBarColor = isPaid
      ? colors.statusOpen
      : isReported
        ? colors.statusPending
        : colors.surfaceBorder;

    return (
      <View style={[s.participantCard, { borderLeftColor: accentBarColor }]}>
        <View style={s.participantInfo}>
          <Text style={s.participantName}>
            {item.displayName}
            {isWinner ? ' 🎰' : ''}
            {isCoward ? ' 🐔' : ''}
          </Text>
          <Text style={[
            s.participantStatus,
            isPaid && { color: colors.statusOpen },
            isReported && { color: colors.statusPending },
          ]}>
            {statusLabel}
          </Text>
        </View>
        <View style={s.participantRight}>
          <Text style={[s.participantAmount, isPaid && { color: colors.statusOpen }]}>
            {formatCOP(item.amount)}
          </Text>
          {!isPaid && !isReported && isMe && item.amount > 0 && (
            <TouchableOpacity style={s.payButton} onPress={() => handleReportPaid(item.userId)}>
              <Text style={s.payButtonText}>{t('session.reportPaidButton')}</Text>
            </TouchableOpacity>
          )}
          {isReported && isAdmin && (
            <TouchableOpacity style={s.approveButton} onPress={() => handleApprovePaid(item.userId)}>
              <Text style={s.approveButtonText}>{t('session.approvePaidButton')}</Text>
            </TouchableOpacity>
          )}
          {isReported && !isAdmin && isMe && (
            <Text style={s.waitingApprovalText}>{t('session.waitingApproval')}</Text>
          )}
        </View>
      </View>
    );
  };

  const statusStyle = getStatusStyle(session.status);

  return (
    <View style={s.container}>
      {/* Session Header */}
      <View style={s.header}>
        <View style={s.codeRow}>
          <Text style={s.joinCodeLabel}>{t('session.code')}</Text>
          <TouchableOpacity onPress={handleCopyCode} activeOpacity={0.6} style={{ flex: 1 }}>
            <Text style={s.joinCode}>{session.joinCode} 📋</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowShareModal(true)} style={s.shareButton}>
            <Text style={s.shareButtonText}>{t('session.share')}</Text>
          </TouchableOpacity>
          <View style={[s.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[s.statusBadgeText, { color: statusStyle.color }]}>
              {session.status}
            </Text>
          </View>
        </View>

        {session.description && (
          <Text style={s.description}>{session.description}</Text>
        )}

        <View style={s.statsRow}>
          <View style={s.stat}>
            <Text style={s.statValue}>{formatCOP(session.totalAmount)}</Text>
            <Text style={s.statLabel}>{t('session.total')}</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statValue}>{totalCount}</Text>
            <Text style={s.statLabel}>{t('session.people')}</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statValue}>{getModeLabel()}</Text>
            <Text style={s.statLabel}>{t('session.mode')}</Text>
          </View>
        </View>

        {/* Animated progress bar */}
        {allSplit && (
          <View style={s.progressContainer}>
            <View style={s.progressBar}>
              <Animated.View
                style={[
                  s.progressFillWrapper,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              >
                <LinearGradient
                  colors={[colors.primary, colors.accent || colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </View>
            <Text style={s.progressText}>
              {t('session.paidCount', { paid: displayPaidCount, total: displayTotalCount })}
            </Text>
          </View>
        )}

        {pendingApprovalsCount > 0 && (
          <View style={[s.pendingApprovalBanner, { backgroundColor: colors.statusPendingBg, borderColor: colors.statusPending }]}>
            <Text style={[s.pendingApprovalText, { color: colors.statusPending }]}>
              {isAdmin
                ? t('session.pendingApprovalsAdmin', { count: pendingApprovalsCount })
                : t('session.pendingApprovalsUser')}
            </Text>
          </View>
        )}

        {canAddParticipants && (
          <TouchableOpacity style={s.addParticipantButton} onPress={openAddParticipantModal}>
            <Text style={s.addParticipantButtonText}>➕ {t('session.addParticipants')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Participants List */}
      <FlatList
        data={session.participants}
        keyExtractor={(item) => item.userId}
        renderItem={renderParticipant}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Text style={s.emptyEmoji}>👥</Text>
            <Text style={s.emptyText}>{t('session.noParticipants')}</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchSession(); }}
            tintColor={colors.primary}
          />
        }
      />

      {/* Bottom Actions */}
      {!allSplit && totalCount > 0 && (
        <View style={s.bottomBar}>
          <TouchableOpacity
            onPress={handleSplit}
            disabled={splitting}
            style={{ borderRadius: borderRadius.md, overflow: 'hidden', opacity: splitting ? 0.6 : 1 }}
          >
            <LinearGradient
              colors={[colors.primary, colors.accent || colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.splitButton}
            >
              {splitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.splitButtonText}>{splitActionLabel}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {(session.status === 'open' && allSplit && user?.id === session.adminId) || user?.id === session.adminId ? (
        <View style={s.bottomBar}>
          {session.status === 'open' && allSplit && user?.id === session.adminId && (
            <TouchableOpacity
              style={[s.closeSessionButton, closing && s.splitButtonDisabled]}
              onPress={handleCloseSession}
              disabled={closing}
            >
              {closing ? (
                <ActivityIndicator color={colors.danger} />
              ) : (
                <Text style={s.closeSessionButtonText}>{t('session.closeSession')}</Text>
              )}
            </TouchableOpacity>
          )}

          {user?.id === session.adminId && (
            <TouchableOpacity
              style={s.deleteSessionLink}
              onPress={handleDeleteSession}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator color={colors.textMuted} />
              ) : (
                <Text style={s.deleteSessionLinkText}>{t('session.deleteSession')}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      {session.status === 'closed' && (
        <LinearGradient
          colors={[colors.primary, colors.accent || colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.closedBanner}
        >
          <Text style={s.closedText}>{t('session.allPaid')}</Text>
        </LinearGradient>
      )}

      {/* Roulette Modal */}
      <Modal
        visible={showRoulette}
        animationType="slide"
        transparent
        onRequestClose={handleCloseRouletteModal}
      >
        <View style={[s.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={s.modalContent}>
            <RouletteWheel
              participants={session.participants}
              winnerIndex={rouletteWinner}
              onFinish={handleRouletteFinish}
            />
            {canCloseRoulette && (
              <TouchableOpacity
                style={s.closeRouletteButton}
                onPress={handleCloseRouletteModal}
              >
                <Text style={s.closeRouletteButtonText}>{t('session.closeRoulette')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Add Participant Modal */}
      <Modal
        visible={showAddParticipantModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddParticipantModal(false)}
      >
        <View style={[s.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={s.modalContent}>
            <View style={s.searchModalInner}>
              <View style={s.searchModalHeader}>
                <Text style={s.shareModalTitle}>{t('session.addParticipants')}</Text>
                <TouchableOpacity onPress={() => setShowAddParticipantModal(false)}>
                  <Text style={s.searchModalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={s.searchInput}
                placeholder={t('session.searchPeoplePlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={participantSearchQuery}
                onChangeText={setParticipantSearchQuery}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
              />

              {searchingUsers && (
                <ActivityIndicator size="small" color={colors.primary} style={s.searchLoading} />
              )}

              {!searchingUsers && participantSearchQuery.trim().length < 2 && (
                <Text style={s.searchHintText}>{t('session.searchPeopleHint')}</Text>
              )}

              {!searchingUsers && participantSearchQuery.trim().length >= 2 && participantResults.length === 0 && (
                <Text style={s.searchHintText}>{t('session.noUserResults')}</Text>
              )}

              <FlatList
                data={participantResults}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item: foundUser }) => {
                  const alreadyInTable = session.participants.some((p) => p.userId === foundUser.id);
                  const isAdding = addingParticipantId === foundUser.id;

                  return (
                    <View style={s.searchResultCard}>
                      <View style={s.avatarBadge}>
                        <Text style={s.avatarBadgeText}>
                          {foundUser.displayName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={s.searchUserInfo}>
                        <Text style={s.searchUserName}>{foundUser.displayName}</Text>
                        <Text style={s.searchUserMeta}>@{foundUser.username} · {foundUser.phone}</Text>
                      </View>
                      {alreadyInTable ? (
                        <View style={s.alreadyInTableBadge}>
                          <Text style={s.alreadyInTableText}>{t('session.alreadyInTable')}</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={s.addUserButton}
                          onPress={() => handleAddParticipant(foundUser)}
                          disabled={isAdding}
                        >
                          {isAdding ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={s.addUserButtonText}>{t('groups.addButton')}</Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Share / QR Modal */}
      <Modal
        visible={showShareModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowShareModal(false)}
      >
        <TouchableOpacity
          style={[s.modalOverlay, { backgroundColor: colors.overlay }]}
          activeOpacity={1}
          onPress={() => setShowShareModal(false)}
        >
          <View style={s.modalContent}>
            <View style={s.shareModalInner}>
              <Text style={s.shareModalTitle}>{t('session.shareTitle')}</Text>
              <QRCode
                value={getShareLink()}
                size={180}
                label={t('session.scanToJoin')}
              />
              <View style={s.shareCodeBox}>
                <Text style={s.shareCodeLabel}>{t('session.code')}</Text>
                <Text style={s.shareCodeValue}>{session.joinCode}</Text>
              </View>
              <TouchableOpacity style={s.shareTextButton} onPress={handleTextShare}>
                <LinearGradient
                  colors={[colors.primary, colors.accent || colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.shareTextButtonInner}
                >
                  <Text style={s.shareTextButtonLabel}>{t('session.sendMessage')}</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={s.shareLinkButton} onPress={handleCopyLink}>
                <Text style={s.shareLinkButtonLabel}>{t('session.copyLink')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.closeModalButton} onPress={() => setShowShareModal(false)}>
                <Text style={s.closeModalText}>{t('session.close')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonContainer: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  // Header card — warm surface
  header: {
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  joinCodeLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  joinCode: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.accent,        // dorado for join code
    letterSpacing: 2,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  statusBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  shareButton: {
    backgroundColor: colors.surface,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary + '50',
  },
  shareButtonText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.surfaceBorder,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  progressContainer: {
    marginTop: spacing.md,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFillWrapper: {
    height: '100%',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  addParticipantButton: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary + '50',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    backgroundColor: colors.surface,
  },
  addParticipantButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  // Participant card — warm surface with colored left-border (signature)
  participantCard: {
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs + 2,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderLeftWidth: 3,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  participantStatus: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  participantRight: {
    alignItems: 'flex-end',
  },
  participantAmount: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
  },
  payButton: {
    backgroundColor: colors.primary,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  payButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.background,
  },
  approveButton: {
    backgroundColor: colors.statusPending,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  approveButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.background,
  },
  waitingApprovalText: {
    fontSize: fontSize.xs,
    color: colors.statusPending,
    marginTop: spacing.xs,
    fontWeight: fontWeight.semibold,
  },
  pendingApprovalBanner: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  pendingApprovalText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 44,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomBar: {
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: 8,
  },
  splitButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  splitButtonDisabled: {
    opacity: 0.55,
  },
  splitButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.background,
    letterSpacing: 0.2,
  },
  closedBanner: {
    padding: spacing.md,
    alignItems: 'center',
  },
  closedText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.background,
  },
  closeSessionButton: {
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.danger + '80',
  },
  closeSessionButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.danger,
  },
  deleteSessionLink: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  deleteSessionLinkText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    maxWidth: 360,
    width: '90%',
    overflow: 'hidden',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  shareModalInner: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  searchModalInner: {
    padding: spacing.lg,
  },
  searchModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  searchModalClose: {
    fontSize: 20,
    color: colors.textMuted,
    paddingHorizontal: spacing.xs,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: spacing.sm,
  },
  searchLoading: {
    marginVertical: spacing.md,
  },
  searchHintText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surfaceBorder,
    gap: spacing.sm,
  },
  avatarBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBadgeText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
  },
  searchUserInfo: {
    flex: 1,
  },
  searchUserName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  searchUserMeta: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  alreadyInTableBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  alreadyInTableText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  addUserButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    minWidth: 60,
    alignItems: 'center',
  },
  addUserButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.background,
  },
  shareModalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.lg,
    letterSpacing: -0.2,
  },
  shareCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: spacing.sm,
  },
  shareCodeLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  shareCodeValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.accent,
    letterSpacing: 2,
  },
  shareTextButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    width: '100%',
  },
  shareTextButtonInner: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  shareTextButtonLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.background,
  },
  shareLinkButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary + '50',
  },
  shareLinkButtonLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  closeModalButton: {
    paddingVertical: spacing.sm,
  },
  closeModalText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  closeRouletteButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  closeRouletteButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.background,
  },
});
