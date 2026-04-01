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
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { DebtSummary, PaymentSession, Participant, User, formatCOP } from '@lavaca/types';
import { api } from '../../src/services/api';
import { spacing, borderRadius, fontSize, fontWeight, type ThemeColors } from '../../src/constants/theme';
import { SkeletonCard, ErrorState, Avatar, StatusPill, AnimatedCard, SplitBar, RouletteWheel, QRCode, DebtPaymentInstructions, useToast } from '../../src/components';
import { useI18n } from '../../src/i18n';
import { useTheme } from '../../src/theme';
import { useAuth } from '../../src/auth';
import { useSessionSocket } from '../../src/hooks/useSessionSocket';

import { getErrorMessage } from '../../src/utils/errorMessage';

const TOTAL_SUGGESTED_PARTICIPANTS = 8;
const MAX_RELATED_PARTICIPANTS = 5;

export default function SessionScreen() {
  const { joinCode } = useLocalSearchParams<{ joinCode: string }>();
  const router = useRouter();
  const { translate } = useI18n();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const styles = createStyles(colors);

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
  const [frequentParticipants, setFrequentParticipants] = useState<User[]>([]);
  const [suggestedParticipants, setSuggestedParticipants] = useState<User[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [addingParticipantId, setAddingParticipantId] = useState<string | null>(null);
  const [debts, setDebts] = useState<DebtSummary[]>([]);
  const [loadingDebts, setLoadingDebts] = useState(false);
  
  // Animated progress bar width
  const progressAnim = useRef(new Animated.Value(0)).current;

  const fetchSession = useCallback(async () => {
    if (!joinCode) return;
    try {
      const data = await api.getSession(joinCode);
      setSession(data);
      setFetchError(null);
    } catch (err: unknown) {
      setFetchError(getErrorMessage(err, translate('common.error')));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [joinCode, translate]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const fetchDebts = useCallback(async () => {
    if (!joinCode || !user?.id) {
      setDebts([]);
      return;
    }

    setLoadingDebts(true);
    try {
      const data = await api.getSessionDebts(joinCode, user.id);
      setDebts(data);
    } catch {
      setDebts([]);
    } finally {
      setLoadingDebts(false);
    }
  }, [joinCode, user?.id]);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts, session?.participants]);
  
  // Real-time updates
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
  }, [progressAnim, session]);

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
        const existingIds = new Set((session?.participants || []).map((p) => p.userId));
        const filtered = results
          .filter((r) => r.id !== user?.id)
          .filter((r) => !existingIds.has(r.id));
        setParticipantResults(filtered.slice(0, TOTAL_SUGGESTED_PARTICIPANTS));
      } catch {
        setParticipantResults([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [participantSearchQuery, session?.participants, showAddParticipantModal, user?.id]);

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
    } catch (err: unknown) {
      Alert.alert('Error', getErrorMessage(err));
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
    const webLink = `https://lavaca.app/join?code=${joinCode}`;
    try {
      await Share.share({
        message: Platform.OS === 'android'
          ? `${translate('session.shareMessage', { code: joinCode as string })}\n${webLink}`
          : translate('session.shareMessage', { code: joinCode as string }),
        url: Platform.OS === 'ios' ? webLink : undefined,
      });
    } catch {}
  };

  const handleCopyLink = async () => {
    const link = getShareLink();
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(link);
      showSuccess(translate('session.copied'));
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
      showSuccess(translate('session.reportedPaid'));
    } catch (err: unknown) {
      showError(getErrorMessage(err, translate('common.error')));
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
      showSuccess(translate('session.paymentApproved'));
    } catch (err: unknown) {
      showError(getErrorMessage(err, translate('common.error')));
    }
  };

  const handleRejectPaid = useCallback(async (userId: string) => {
    if (!joinCode || !session) return;
    try {
      const updated = await api.rejectPaid(joinCode as string, {
        userId,
        adminId: session.adminId,
      });
      setSession(updated);
      showSuccess(translate('session.paymentRejected'));
    } catch (err: unknown) {
      showError(getErrorMessage(err, translate('common.error')));
    }
  }, [joinCode, session, translate, showSuccess, showError]);
  
  const handleMarkPaid = async (debt: DebtSummary) => {
    if (!joinCode || !user) return;
    try {
      const updated = await api.reportPaid(joinCode, {
        userId: user.id,
        reporterId: user.id,
        paymentMethod: 'nequi',
      });
      setSession(updated);
      setDebts((prev) => prev.filter((item) => item.debtorId !== debt.debtorId));
      showSuccess(translate('debt.marked'));
    } catch (err: unknown) {
      showError(getErrorMessage(err, translate('common.error')));
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
      showSuccess(translate('session.codeCopied'));
    } catch {}
  };

  const handleCloseSession = () => {
    if (!joinCode || !session) return;
    if (session.status !== 'open') {
      showError(translate('session.closeNotOpen'));
      return;
    }

    const owedPendingCount = session.participants.filter((p) => p.amount > 0 && p.status !== 'confirmed').length;
    const msg = owedPendingCount > 0
      ? translate('session.closeConfirmPending', { count: owedPendingCount })
      : translate('session.closeConfirmMsg');

    const confirmClose = async () => {
      setClosing(true);
      try {
        const updated = await api.closeSession(joinCode);
        if (updated.status !== 'closed') {
          showError(translate('session.closeFailed'));
          return;
        }
        setSession(updated);
        showSuccess(translate('session.closedSuccess'));
        fetchSession();
      } catch (err: unknown) {
        showError(getErrorMessage(err, translate('common.error')));
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
      translate('session.closeConfirmTitle'),
      msg,
      [
        { text: translate('profile.cancel'), style: 'cancel' },
        { text: translate('session.closeConfirmBtn'), style: 'destructive', onPress: confirmClose },
      ]
    );
  };

  const handleDeleteSession = () => {
    if (!joinCode || !session) return;
    if (user?.id !== session.adminId) {
      showError(translate('session.deleteNotAdmin'));
      return;
    }

    const msg = translate('session.deleteConfirmMsg');
    const confirmDelete = async () => {
      setDeleting(true);
      try {
        await api.deleteSession(joinCode, { adminId: session.adminId });
        showSuccess(translate('session.deleteSuccess'));
        router.replace('/(tabs)');
      } catch (err: unknown) {
        showError(getErrorMessage(err, translate('session.deleteError')));
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
      translate('session.deleteConfirmTitle'),
      msg,
      [
        { text: translate('profile.cancel'), style: 'cancel' },
        { text: translate('session.deleteConfirmBtn'), style: 'destructive', onPress: confirmDelete },
      ]
    );
  };

  const openAddParticipantModal = async () => {
    setParticipantSearchQuery('');
    setParticipantResults([]);
    setFrequentParticipants([]);
    setSuggestedParticipants([]);
    setSearchingUsers(false);
    setShowAddParticipantModal(true);

    if (!user?.id) return;

    setLoadingSuggestions(true);
    try {
      const existingIds = new Set((session?.participants || []).map((p) => p.userId));

      const relatedRaw = await api.getFrequentUsers(user.id, MAX_RELATED_PARTICIPANTS);
      const related = relatedRaw
        .filter((p) => p.id !== user.id)
        .filter((p) => !existingIds.has(p.id))
        .slice(0, MAX_RELATED_PARTICIPANTS);

      setFrequentParticipants(related);

      const randomCount = related.length === 0
        ? TOTAL_SUGGESTED_PARTICIPANTS
        : TOTAL_SUGGESTED_PARTICIPANTS - related.length;

      const excludeIds = [user.id, ...Array.from(existingIds), ...related.map((p) => p.id)];
      const random = await api.getRandomUsers(randomCount, excludeIds);
      setSuggestedParticipants(random.slice(0, randomCount));
    } catch {
      setFrequentParticipants([]);
      setSuggestedParticipants([]);
    } finally {
      setLoadingSuggestions(false);
    }
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
      setFrequentParticipants((prev) => prev.filter((u) => u.id !== userToAdd.id));
      setSuggestedParticipants((prev) => prev.filter((u) => u.id !== userToAdd.id));
      showSuccess(translate('session.memberAdded', { name: userToAdd.displayName }));
    } catch (err: unknown) {
      showError(getErrorMessage(err, translate('common.error')));
    } finally {
      setAddingParticipantId(null);
    }
  };

  // ── Loading state ──────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.skeletonContainer}>
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </View>
      </View>
    );
  }

  // ── Error / not found ──────────────────────────────────
  if (fetchError || !session) {
    return (
      <View style={[styles.container, styles.center]}>
        <ErrorState message={fetchError || translate('session.notFound')} onRetry={fetchSession} />
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
      case 'equal': return translate('session.equalMode');
      case 'percentage': return translate('session.percentageMode');
      case 'roulette': return translate('session.rouletteMode');
    }
  };

  const splitActionLabel = session.splitMode === 'roulette'
    ? translate('session.spinRouletteButton')
    : translate('session.splitButton');

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'open': return { color: colors.statusOpen, bg: colors.statusOpenBg };
      case 'closed': return { color: colors.statusClosed, bg: colors.statusClosedBg };
      default: return { color: colors.statusCancelled, bg: colors.statusCancelledBg };
    }
  };

  const getSessionStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return translate('common.open');
      case 'closed': return translate('common.closed');
      default: return translate('home.cancelled');
    }
  };

  const renderParticipant = ({ item, index }: { item: Participant; index: number }) => {
    const isPaid = item.status === 'confirmed';
    const isReported = item.status === 'reported';
    const isRejected = item.status === 'rejected';
    const isMe = user?.id === item.userId;
    const isWinner = item.isRouletteWinner;
    const isCoward = item.isRouletteCoward;
    const isNoPay = item.amount <= 0;

    const statusLabel = isNoPay
      ? translate('session.noPay')
      : isPaid
        ? translate('common.confirmed')
        : isReported
          ? translate('session.pendingApproval')
          : isRejected
            ? translate('common.rejected')
            : translate('common.pending');

    const statusPillVariant = isPaid ? 'success' : isReported ? 'warning' : isRejected ? 'error' : 'muted';

    // Left-border accent — the signature element (like flagging a bill)
    const accentBarColor = isPaid
      ? colors.statusOpen
      : isReported
        ? colors.statusPending
        : colors.surfaceBorder;

    return (
      <AnimatedCard
        index={index}
        style={{ ...styles.participantCard, borderLeftColor: accentBarColor }}
      >
        <View style={styles.participantRow}>
          <Avatar displayName={item.displayName} size={36} />
          <View style={styles.participantInfo}>
            <View style={styles.participantNameRow}>
              <Text style={styles.participantName}>{item.displayName}</Text>
              {isWinner ? (
                <View style={styles.participantFlag}>
                  <Feather name='shuffle' size={12} color={colors.accent} />
                </View>
              ) : null}
              {isCoward ? (
                <View style={styles.participantFlag}>
                  <Feather name='shield-off' size={12} color={colors.warning} />
                </View>
              ) : null}
            </View>
            <StatusPill variant={statusPillVariant} label={statusLabel} />
          </View>
          <View style={styles.participantRight}>
            <Text style={[styles.participantAmount, isPaid && { color: colors.statusOpen }]}>
              {formatCOP(item.amount)}
            </Text>
            {!isPaid && !isReported && isMe && item.amount > 0 && (
              <TouchableOpacity style={styles.payButton} onPress={() => handleReportPaid(item.userId)}>
                <Text style={styles.payButtonText}>{translate('session.reportPaidButton')}</Text>
              </TouchableOpacity>
            )}
            {isReported && isAdmin && (
              <View style={styles.adminActionsRow}>
                <TouchableOpacity style={styles.approveButton} onPress={() => handleApprovePaid(item.userId)}>
                  <Text style={styles.approveButtonText}>{translate('session.approvePaidButton')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => handleRejectPaid(item.userId)}
                >
                  <Text style={styles.rejectButtonText}>{translate('session.rejectPaidButton')}</Text>
                </TouchableOpacity>
              </View>
            )}
            {isReported && !isAdmin && isMe && (
              <Text style={styles.waitingApprovalText}>{translate('session.waitingApproval')}</Text>
            )}
            {item.paymentMethod && item.paymentMethod !== 'other' && (
              <Text style={styles.paymentMethodBadge}>{item.paymentMethod.toUpperCase()}</Text>
            )}
          </View>
        </View>
      </AnimatedCard>
    );
  };

  const statusStyle = getStatusStyle(session.status);

  return (
    <View style={styles.container}>
      {/* Session Header */}
      <View style={styles.header}>
        <View style={styles.codeRow}>
          <Text style={styles.joinCodeLabel}>{translate('session.code')}</Text>
          <TouchableOpacity onPress={handleCopyCode} activeOpacity={0.6} style={styles.joinCodeWrap}>
            <Text style={styles.joinCode}>{session.joinCode}</Text>
            <Feather name='copy' size={14} color={colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowShareModal(true)} style={styles.shareButton}>
            <Text style={styles.shareButtonText}>{translate('session.share')}</Text>
          </TouchableOpacity>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusStyle.color }]}>
              {getSessionStatusLabel(session.status)}
            </Text>
          </View>
        </View>

        {session.description && (
          <Text style={styles.description}>{session.description}</Text>
        )}

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatCOP(session.totalAmount)}</Text>
            <Text style={styles.statLabel}>{translate('session.total')}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totalCount}</Text>
            <Text style={styles.statLabel}>{translate('session.people')}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{getModeLabel()}</Text>
            <Text style={styles.statLabel}>{translate('session.mode')}</Text>
          </View>
        </View>

        {/* Payment progress summary */}
        <View style={styles.splitBarContainer}>
          <SplitBar paid={displayPaidCount} total={displayTotalCount} amount={session.totalAmount} currency={session.currency} />
        </View>

        {/* Animated progress bar */}
        {allSplit && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFillWrapper,
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
          </View>
        )}

        {pendingApprovalsCount > 0 && (
          <View style={[styles.pendingApprovalBanner, { backgroundColor: colors.statusPendingBg, borderColor: colors.statusPending }]}>
            <Text style={[styles.pendingApprovalText, { color: colors.statusPending }]}>
              {isAdmin
                ? translate('session.pendingApprovalsAdmin', { count: pendingApprovalsCount })
                : translate('session.pendingApprovalsUser')}
            </Text>
          </View>
        )}

        {canAddParticipants && (
          <TouchableOpacity style={styles.addParticipantButton} onPress={openAddParticipantModal} accessibilityRole='button' accessibilityLabel={translate('session.addParticipants')}>
            <Feather name='plus' size={16} color={colors.primary} />
            <Text style={styles.addParticipantButtonText}>{translate('session.addParticipants')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Participants List */}
      <DebtPaymentInstructions debts={debts} loading={loadingDebts} onMarkPaid={handleMarkPaid} />

      <FlatList
        data={session.participants}
        keyExtractor={(item) => item.userId}
        renderItem={({ item, index }) => renderParticipant({ item, index })}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Feather name='users' size={24} color={colors.textSecondary} />
            </View>
            <Text style={styles.emptyText}>{translate('session.noParticipants')}</Text>
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
        <View style={styles.bottomBar}>
          <TouchableOpacity
            onPress={handleSplit}
            disabled={splitting}
            style={{ borderRadius: borderRadius.md, overflow: 'hidden', opacity: splitting ? 0.6 : 1 }}
          >
            <LinearGradient
              colors={[colors.primary, colors.accent || colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.splitButton}
            >
              {splitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.splitButtonText}>{splitActionLabel}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {(session.status === 'open' && allSplit && user?.id === session.adminId) || user?.id === session.adminId ? (
        <View style={styles.bottomBar}>
          {session.status === 'open' && allSplit && user?.id === session.adminId && (
            <TouchableOpacity
              style={[styles.closeSessionButton, closing && styles.splitButtonDisabled]}
              onPress={handleCloseSession}
              disabled={closing}
            >
              {closing ? (
                <ActivityIndicator color={colors.danger} />
              ) : (
                <Text style={styles.closeSessionButtonText}>{translate('session.closeSession')}</Text>
              )}
            </TouchableOpacity>
          )}

          {user?.id === session.adminId && (
            <TouchableOpacity
              style={styles.deleteSessionLink}
              onPress={handleDeleteSession}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator color={colors.textMuted} />
              ) : (
                <Text style={styles.deleteSessionLinkText}>{translate('session.deleteSession')}</Text>
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
          style={styles.closedBanner}
        >
          <Text style={styles.closedText}>{translate('session.allPaid')}</Text>
        </LinearGradient>
      )}

      {/* Roulette Modal */}
      <Modal
        visible={showRoulette}
        animationType="slide"
        transparent
        onRequestClose={handleCloseRouletteModal}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={styles.modalContent}>
            <RouletteWheel
              participants={session.participants}
              winnerIndex={rouletteWinner}
              onFinish={handleRouletteFinish}
            />
            {canCloseRoulette && (
              <TouchableOpacity
                style={styles.closeRouletteButton}
                onPress={handleCloseRouletteModal}
              >
                <Text style={styles.closeRouletteButtonText}>{translate('session.closeRoulette')}</Text>
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
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={styles.modalContent}>
            <View style={styles.searchModalInner}>
              <View style={styles.searchModalHeader}>
                <Text style={styles.shareModalTitle}>{translate('session.addParticipants')}</Text>
                <TouchableOpacity onPress={() => setShowAddParticipantModal(false)} accessibilityRole='button' accessibilityLabel={translate('common.cancel')}>
                  <Feather name='x' size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.searchInput}
                placeholder={translate('session.searchPeoplePlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={participantSearchQuery}
                onChangeText={setParticipantSearchQuery}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
              />

              {loadingSuggestions && participantSearchQuery.trim().length < 2 && (
                <ActivityIndicator size="small" color={colors.primary} style={styles.searchLoading} />
              )}

              {searchingUsers && (
                <ActivityIndicator size="small" color={colors.primary} style={styles.searchLoading} />
              )}

              {!loadingSuggestions && !searchingUsers && participantSearchQuery.trim().length < 2 && frequentParticipants.length === 0 && suggestedParticipants.length === 0 && (
                <Text style={styles.searchHintText}>{translate('create.noFrequentPeople')}</Text>
              )}

              {!searchingUsers && participantSearchQuery.trim().length >= 2 && participantResults.length === 0 && (
                <Text style={styles.searchHintText}>{translate('session.noUserResults')}</Text>
              )}

              <FlatList
                data={participantSearchQuery.trim().length >= 2
                  ? participantResults
                  : [
                    ...(frequentParticipants.length > 0
                      ? [{ id: '__related__', type: 'label', label: translate('create.frequentPeopleHint') as string }, ...frequentParticipants]
                      : []),
                    ...(suggestedParticipants.length > 0
                      ? [{ id: '__suggested__', type: 'label', label: translate('create.suggestedPeople') as string }, ...suggestedParticipants]
                      : []),
                  ]}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  if ((item as { type?: string }).type === 'label') {
                    return <Text style={styles.searchSectionLabel}>{(item as { label: string }).label}</Text>;
                  }

                  const foundUser = item as User;
                  const alreadyInTable = session.participants.some((p) => p.userId === foundUser.id);
                  const isAdding = addingParticipantId === foundUser.id;

                  return (
                    <View style={styles.searchResultCard}>
                      <View style={styles.avatarBadge}>
                        <Text style={styles.avatarBadgeText}>
                          {foundUser.displayName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.searchUserInfo}>
                        <Text style={styles.searchUserName}>{foundUser.displayName}</Text>
                        <Text style={styles.searchUserMeta}>@{foundUser.username} · {foundUser.phone}</Text>
                      </View>
                      {alreadyInTable ? (
                        <View style={styles.alreadyInTableBadge}>
                          <Text style={styles.alreadyInTableText}>{translate('session.alreadyInTable')}</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.addUserButton}
                          onPress={() => handleAddParticipant(foundUser)}
                          disabled={isAdding}
                        >
                          {isAdding ? (
                            <ActivityIndicator size="small" color={colors.white} />
                          ) : (
                            <Text style={styles.addUserButtonText}>{translate('groups.addButton')}</Text>
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
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          activeOpacity={1}
          onPress={() => setShowShareModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.shareModalInner}>
              <Text style={styles.shareModalTitle}>{translate('session.shareTitle')}</Text>
              <QRCode
                value={getShareLink()}
                size={180}
                label={translate('session.scanToJoin')}
              />
              <View style={styles.shareCodeBox}>
                <Text style={styles.shareCodeLabel}>{translate('session.code')}</Text>
                <Text style={styles.shareCodeValue}>{session.joinCode}</Text>
              </View>
              <TouchableOpacity style={styles.shareTextButton} onPress={handleTextShare}>
                <LinearGradient
                  colors={[colors.primary, colors.accent || colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.shareTextButtonInner}
                >
                  <Text style={styles.shareTextButtonLabel}>{translate('session.sendMessage')}</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareLinkButton} onPress={handleCopyLink}>
                <Text style={styles.shareLinkButtonLabel}>{translate('session.copyLink')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowShareModal(false)}>
                <Text style={styles.closeModalText}>{translate('session.close')}</Text>
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
  joinCodeWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
  splitBarContainer: {
    marginTop: spacing.md,
  },
  // Participant card — AnimatedCard with colored left-border (signature)
  participantCard: {
    padding: spacing.md,
    marginBottom: spacing.xs + 2,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  participantInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  participantNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  participantName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  participantFlag: {
    width: 20,
    height: 20,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
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
  emptyIconWrap: {
    width: 58,
    height: 58,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface3,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  rejectButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.danger + '60',
    alignItems: 'center',
  },
  adminActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  rejectButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.danger,
  },
  paymentMethodBadge: {
    fontSize: fontSize.xs,
    color: colors.accent,
    fontWeight: fontWeight.semibold,
    backgroundColor: colors.accent + '15',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  bottomBar: {
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.md,
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
  searchSectionLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
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
