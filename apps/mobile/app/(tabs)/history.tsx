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
import { GlassCard, SkeletonCard, EmptyState } from '../../src/components';
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

  const renderSession = ({ item }: { item: PaymentSession }) => {
    const myParticipation = item.participants.find((p) => p.userId === user?.id);
    const myAmount = myParticipation?.amount || 0;
    const isAdmin = item.adminId === user?.id;
    const isPaid = myParticipation?.status === 'confirmed';

    return (
      <TouchableOpacity onPress={() => router.push(`/session/${item.joinCode}` as any)}>
        <GlassCard style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.statusEmoji}>{STATUS_EMOJI[item.status] || '🟢'}</Text>
            <View style={s.cardHeaderInfo}>
              <Text style={s.cardTitle} numberOfLines={1}>
                {item.description || t('history.untitled')}
              </Text>
              <Text style={s.cardTime}>{timeAgo(item.createdAt, t('common.now'))}</Text>
            </View>
            <Text style={s.modeEmoji}>{MODE_EMOJI[item.splitMode] || '⚖️'}</Text>
          </View>

          <View style={s.cardBody}>
            <View style={s.stat}>
              <Text style={s.statLabel}>{t('session.total')}</Text>
              <Text style={s.statValue}>{formatAmount(item.totalAmount, item.currency)}</Text>
            </View>
            <View style={s.stat}>
              <Text style={s.statLabel}>{t('history.myPart')}</Text>
              <Text style={[s.statValue, { color: colors.accent }]}>
                {formatAmount(myAmount, item.currency)}
              </Text>
            </View>
            <View style={s.stat}>
              <Text style={s.statLabel}>{t('session.people')}</Text>
              <Text style={s.statValue}>{item.participants.length}</Text>
            </View>
          </View>

          <View style={s.cardFooter}>
            <Text style={s.roleTag}>
              {isAdmin ? '👑 ' + t('history.organizer') : '👤 ' + t('history.participant')}
            </Text>
            {myParticipation && (
              <View style={[
                s.paymentBadge,
                isPaid
                  ? { backgroundColor: colors.statusOpenBg, borderColor: colors.statusOpen }
                  : { backgroundColor: colors.statusPendingBg, borderColor: colors.statusPending },
              ]}>
                <Text style={[s.paymentBadgeText, { color: isPaid ? colors.statusOpen : colors.statusPending }]}>
                  {isPaid ? t('session.paid') : t('session.pending')}
                </Text>
              </View>
            )}
          </View>
        </GlassCard>
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
          renderItem={renderSession}
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
    list: { padding: spacing.md },
    card: { padding: spacing.md, marginBottom: spacing.sm, borderRadius: borderRadius.lg },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    statusEmoji: { fontSize: 20, marginRight: spacing.sm },
    cardHeaderInfo: { flex: 1 },
    cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
    cardTime: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
    modeEmoji: { fontSize: 20 },
    cardBody: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.glassBorder,
      borderBottomWidth: 1,
      borderBottomColor: colors.glassBorder,
    },
    stat: { alignItems: 'center', flex: 1 },
    statLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: 2 },
    statValue: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    roleTag: { fontSize: fontSize.sm, color: colors.textSecondary },
    paymentBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.sm,
      borderWidth: 1,
    },
    paymentBadgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  });
