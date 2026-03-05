import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { PaymentSession } from '@lavaca/shared';
import { formatCOP } from '@lavaca/shared';
import { spacing, borderRadius, fontSize, fontWeight, type ThemeColors } from '../../src/constants/theme';
import { SkeletonCard, EmptyState, Avatar, StatusPill, AnimatedCard } from '../../src/components';
import { useI18n } from '../../src/i18n';
import { useTheme } from '../../src/theme';
import { useAuth } from '../../src/auth';
import { api } from '../../src/services/api';

const STATUS_EMOJI: Record<string, string> = {
  open: '🟢',
  closed: '✅',
  cancelled: '❌',
};

const MODE_EMOJI: Record<string, string> = {
  equal: '⚖️',
  percentage: '📊',
  roulette: '🎰',
};

const STATUS_COLOR: Record<string, (c: ThemeColors) => string> = {
  open: (c) => c.statusOpen,
  closed: (c) => c.statusClosed,
  cancelled: (c) => c.statusCancelled,
};

function formatAmount(amount: number, currency = 'COP'): string {
  if (currency === 'COP') return formatCOP(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function timeAgo(date: Date | string, nowLabel = 'now'): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return nowLabel;
  if (mins < 60) return `${mins}m`;
  if (hrs < 24) return `${hrs}h`;
  if (days < 30) return `${days}d`;
  return new Date(date).toLocaleDateString();
}

export default function HistoryTab() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const s = createStyles(colors);

  const [sessions, setSessions] = useState<PaymentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.getUserHistory(user.id);
      setSessions(data);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const renderSession = ({ item, index }: { item: PaymentSession; index: number }) => {
    const myParticipation = item.participants.find((p) => p.userId === user?.id);
    const myAmount = myParticipation?.amount || 0;
    const isAdmin = item.adminId === user?.id;
    const isPaid = myParticipation?.status === 'confirmed';
    const accentBar = STATUS_COLOR[item.status]?.(colors) ?? colors.statusOpen;
    const adminName = item.participants.find((p) => p.userId === item.adminId)?.displayName || item.description || '?';

    const statusPillVariant = item.status === 'open' ? 'success' : item.status === 'closed' ? 'muted' : 'error';
    const statusLabel = item.status === 'open' ? t('common.open') : item.status === 'closed' ? t('common.closed') : t('home.cancelled');

    return (
      <TouchableOpacity onPress={() => router.push(`/session/${item.joinCode}` as any)} activeOpacity={0.75}>
        <AnimatedCard index={index} style={{ ...s.card, borderLeftColor: accentBar }}>
          <View style={s.cardHeader}>
            <Avatar displayName={adminName} size={36} />
            <View style={s.cardHeaderInfo}>
              <Text style={s.cardTitle} numberOfLines={1}>
                {item.description || t('history.untitled')}
              </Text>
              <Text style={s.cardTime}>{timeAgo(item.createdAt, t('common.now'))}</Text>
            </View>
            <View style={s.cardHeaderRight}>
              <Text style={s.modeEmoji}>{MODE_EMOJI[item.splitMode] || '⚖️'}</Text>
              <StatusPill variant={statusPillVariant} label={statusLabel} />
            </View>
          </View>

          {/* Stats row */}
          <View style={s.cardBody}>
            <View style={s.stat}>
              <Text style={s.statLabel}>{t('session.total')}</Text>
              <Text style={s.statValue}>{formatAmount(item.totalAmount, item.currency)}</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.stat}>
              <Text style={s.statLabel}>{t('history.myPart')}</Text>
              <Text style={[s.statValue, { color: colors.accent }]}>
                {formatAmount(myAmount, item.currency)}
              </Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.stat}>
              <Text style={s.statLabel}>{t('session.people')}</Text>
              <Text style={s.statValue}>{item.participants.length}</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={s.cardFooter}>
            <Text style={s.roleTag}>
              {isAdmin ? '👑 ' + t('history.organizer') : '👤 ' + t('history.participant')}
            </Text>
            {myParticipation && (
              <StatusPill
                variant={isPaid ? 'success' : 'warning'}
                label={isPaid ? t('common.paid') : t('common.pending')}
              />
            )}
          </View>
        </AnimatedCard>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={s.container}>
        <View style={{ padding: spacing.md, gap: spacing.sm }}>
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {sessions.length === 0 ? (
        <View style={s.emptyWrapper}>
          <EmptyState emoji="📋" title={t('history.empty')} hint={t('history.emptyHint')} />
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => renderSession({ item, index })}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchHistory(); }}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    emptyWrapper: { flex: 1, justifyContent: 'center', padding: spacing.xl },
    list: { padding: spacing.md, gap: spacing.xs + 2 },
    // Card with colored left-border signature — AnimatedCard provides background
    card: {
      borderRadius: borderRadius.md,
      padding: spacing.md,
      borderLeftWidth: 3,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    cardHeaderInfo: { flex: 1 },
    cardHeaderRight: {
      alignItems: 'flex-end',
      gap: spacing.xs,
    },
    cardTitle: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: colors.text,
      marginBottom: 2,
    },
    cardTime: { fontSize: fontSize.xs, color: colors.textMuted },
    modeEmoji: { fontSize: 18 },
    cardBody: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.surfaceBorder,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.surfaceBorder,
    },
    stat: { flex: 1, alignItems: 'center' },
    statDivider: {
      width: StyleSheet.hairlineWidth,
      height: 28,
      backgroundColor: colors.surfaceBorder,
    },
    statLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: 2 },
    statValue: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.text },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    roleTag: { fontSize: fontSize.xs, color: colors.textSecondary },
  });
