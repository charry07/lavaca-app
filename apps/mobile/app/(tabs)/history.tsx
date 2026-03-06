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
import { PaymentSession , formatCOP } from '@lavaca/shared';
import { spacing, borderRadius, fontSize, fontWeight, type ThemeColors } from '../../src/constants/theme';
import { SkeletonCard, EmptyState, Avatar, StatusPill, AnimatedCard } from '../../src/components';
import { useI18n } from '../../src/i18n';
import { useTheme } from '../../src/theme';
import { useAuth } from '../../src/auth';
import { api } from '../../src/services/api';
import { getSessionAccentColor, getSessionPillVariant } from '../../src/utils/sessionStatus';

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
  const { translate } = useI18n();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const styles = createStyles(colors);

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
    const accentBar = getSessionAccentColor(item.status, colors);
    const adminName = item.participants.find((p) => p.userId === item.adminId)?.displayName || item.description || '?';
    const statusPillVariant = getSessionPillVariant(item.status);
    const statusLabel = item.status === 'open' ? translate('common.open') : item.status === 'closed' ? translate('common.closed') : translate('home.cancelled');

    return (
      <TouchableOpacity onPress={() => router.push(`/session/${item.joinCode}` as any)} activeOpacity={0.75}>
        <AnimatedCard index={index} style={{ ...styles.card, borderLeftColor: accentBar }}>
          <View style={styles.cardHeader}>
            <Avatar displayName={adminName} size={36} />
            <View style={styles.cardHeaderInfo}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.description || translate('history.untitled')}
              </Text>
              <Text style={styles.cardTime}>{timeAgo(item.createdAt, translate('common.now'))}</Text>
            </View>
            <View style={styles.cardHeaderRight}>
              <Text style={styles.modeEmoji}>{MODE_EMOJI[item.splitMode] || '⚖️'}</Text>
              <StatusPill variant={statusPillVariant} label={statusLabel} />
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.cardBody}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>{translate('session.total')}</Text>
              <Text style={styles.statValue}>{formatAmount(item.totalAmount, item.currency)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statLabel}>{translate('history.myPart')}</Text>
              <Text style={[styles.statValue, { color: colors.accent }]}>
                {formatAmount(myAmount, item.currency)}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statLabel}>{translate('session.people')}</Text>
              <Text style={styles.statValue}>{item.participants.length}</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <Text style={styles.roleTag}>
              {isAdmin ? '👑 ' + translate('history.organizer') : '👤 ' + translate('history.participant')}
            </Text>
            {myParticipation && (
              <StatusPill
                variant={isPaid ? 'success' : 'warning'}
                label={isPaid ? translate('common.paid') : translate('common.pending')}
              />
            )}
          </View>
        </AnimatedCard>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={{ padding: spacing.md, gap: spacing.sm }}>
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {sessions.length === 0 ? (
        <View style={styles.emptyWrapper}>
          <EmptyState emoji="📋" title={translate('history.empty')} hint={translate('history.emptyHint')} />
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => renderSession({ item, index })}
          contentContainerStyle={styles.list}
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
