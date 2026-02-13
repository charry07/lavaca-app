import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  Share,
  RefreshControl,
  Modal,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { PaymentSession, Participant, formatCOP, rouletteSelect } from '@lavaca/shared';
import { api } from '../../src/services/api';
import { spacing, borderRadius, fontSize, type ThemeColors } from '../../src/constants/theme';
import { RouletteWheel } from '../../src/components/RouletteWheel';
import { QRCode } from '../../src/components/QRCode';
import { useI18n } from '../../src/i18n';
import { useTheme } from '../../src/theme';

export default function SessionScreen() {
  const { joinCode } = useLocalSearchParams<{ joinCode: string }>();
  const { t } = useI18n();
  const { colors } = useTheme();
  const s = createStyles(colors);
  const [session, setSession] = useState<PaymentSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [splitting, setSplitting] = useState(false);
  const [showRoulette, setShowRoulette] = useState(false);
  const [rouletteWinner, setRouletteWinner] = useState(-1);
  const [pendingUpdate, setPendingUpdate] = useState<PaymentSession | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const fetchSession = useCallback(async () => {
    if (!joinCode) return;
    try {
      const data = await api.getSession(joinCode);
      setSession(data);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [joinCode]);

  useEffect(() => {
    fetchSession();
    // Poll every 3 seconds for real-time updates
    const interval = setInterval(fetchSession, 3000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  const handleSplit = async () => {
    if (!joinCode || !session) return;
    setSplitting(true);
    try {
      const updated = await api.splitSession(joinCode);

      if (session.splitMode === 'roulette' && updated.participants.length > 1) {
        // Find the winner index for the animation
        const winnerIdx = updated.participants.findIndex((p) => p.isRouletteWinner);
        if (winnerIdx >= 0) {
          setRouletteWinner(winnerIdx);
          setPendingUpdate(updated);
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
    // After animation ends, apply the actual session update
    setTimeout(() => {
      if (pendingUpdate) {
        setSession(pendingUpdate);
        setPendingUpdate(null);
      }
      setShowRoulette(false);
    }, 2500);
  };

  const handleShare = () => {
    setShowShareModal(true);
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
        message: `Unete a La Vaca! 🐄\n\n${link}\n\nCodigo: ${joinCode}`,
        url: link,
      });
    } catch {}
  };

  const handleCopyLink = async () => {
    const link = getShareLink();
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(link);
      Alert.alert('Copiado!', 'El enlace se copio al portapapeles');
    } else {
      await Share.share({ message: link });
    }
  };

  const handleMarkPaid = async (userId: string) => {
    if (!joinCode) return;
    try {
      const updated = await api.markPaid(joinCode, { userId, paymentMethod: 'nequi' });
      setSession(updated);
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    }
  };

  if (loading) {
    return (
      <View style={[s.container, s.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[s.container, s.center]}>
        <Text style={s.errorText}>{t('session.notFound')}</Text>
      </View>
    );
  }

  const paidCount = session.participants.filter((p) => p.status === 'confirmed').length;
  const totalCount = session.participants.length;
  const allSplit = session.participants.some((p) => p.amount > 0);

  const getModeLabel = () => {
    switch (session.splitMode) {
      case 'equal': return t('session.equalMode');
      case 'percentage': return t('session.percentageMode');
      case 'roulette': return t('session.rouletteMode');
    }
  };

  const renderParticipant = ({ item }: { item: Participant }) => {
    const isPaid = item.status === 'confirmed';
    const isWinner = item.isRouletteWinner;

    return (
      <View style={[s.participantCard, isPaid && s.participantPaid]}>
        <View style={s.participantInfo}>
          <Text style={s.participantName}>
            {item.displayName}
            {isWinner ? ' 🎰' : ''}
          </Text>
          <Text style={s.participantStatus}>
            {isPaid ? t('session.paid') : t('session.pending')}
          </Text>
        </View>
        <View style={s.participantRight}>
          <Text style={[s.participantAmount, isPaid && s.amountPaid]}>
            {formatCOP(item.amount)}
          </Text>
          {!isPaid && item.amount > 0 && (
            <TouchableOpacity
              style={s.payButton}
              onPress={() => handleMarkPaid(item.userId)}
            >
              <Text style={s.payButtonText}>{t('session.payButton')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      {/* Session Header */}
      <View style={s.header}>
        <View style={s.codeRow}>
          <Text style={s.joinCodeLabel}>{t('session.code')}</Text>
          <Text style={s.joinCode}>{session.joinCode}</Text>
          <TouchableOpacity onPress={handleShare} style={s.shareButton}>
            <Text style={s.shareButtonText}>{t('session.share')}</Text>
          </TouchableOpacity>
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

        {/* Progress bar */}
        {allSplit && (
          <View style={s.progressContainer}>
            <View style={s.progressBar}>
              <View
                style={[
                  s.progressFill,
                  { width: `${totalCount > 0 ? (paidCount / totalCount) * 100 : 0}%` },
                ]}
              />
            </View>
            <Text style={s.progressText}>
              {t('session.paidCount', { paid: paidCount, total: totalCount })}
            </Text>
          </View>
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
            <Text style={s.emptyText}>
              {t('session.noParticipants')}
            </Text>
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
            style={[s.splitButton, splitting && s.splitButtonDisabled]}
            onPress={handleSplit}
            disabled={splitting}
          >
            {splitting ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={s.splitButtonText}>
                {t('session.splitButton')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {session.status === 'closed' && (
        <View style={s.closedBanner}>
          <Text style={s.closedText}>{t('session.allPaid')}</Text>
        </View>
      )}

      {/* Roulette Modal */}
      <Modal
        visible={showRoulette}
        animationType="slide"
        transparent
        onRequestClose={() => {}}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <RouletteWheel
              participants={session.participants}
              winnerIndex={rouletteWinner}
              onFinish={handleRouletteFinish}
            />
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
          style={s.modalOverlay}
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
              <TouchableOpacity
                style={s.shareTextButton}
                onPress={handleTextShare}
              >
                <Text style={s.shareTextButtonLabel}>{t('session.sendMessage')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.shareLinkButton}
                onPress={handleCopyLink}
              >
                <Text style={s.shareLinkButtonLabel}>{t('session.copyLink')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.closeModalButton}
                onPress={() => setShowShareModal(false)}
              >
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
  errorText: {
    color: colors.danger,
    fontSize: fontSize.lg,
  },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  joinCodeLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  joinCode: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 2,
    flex: 1,
  },
  shareButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  shareButtonText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  progressContainer: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  progressText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  list: {
    padding: spacing.lg,
  },
  participantCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: spacing.sm,
  },
  participantPaid: {
    borderColor: colors.primary,
    opacity: 0.8,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  participantStatus: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  participantRight: {
    alignItems: 'flex-end',
  },
  participantAmount: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  amountPaid: {
    color: colors.primary,
  },
  payButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  payButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.background,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomBar: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  splitButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  splitButtonDisabled: {
    opacity: 0.6,
  },
  splitButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.background,
  },
  closedBanner: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    alignItems: 'center',
  },
  closedText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    maxWidth: 360,
    width: '90%',
    overflow: 'hidden',
  },
  shareModalInner: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  shareModalTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.lg,
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
  },
  shareCodeLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  shareCodeValue: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 2,
  },
  shareTextButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    width: '100%',
    alignItems: 'center',
  },
  shareTextButtonLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.background,
  },
  shareLinkButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  shareLinkButtonLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
  },
  closeModalButton: {
    paddingVertical: spacing.sm,
  },
  closeModalText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  });
