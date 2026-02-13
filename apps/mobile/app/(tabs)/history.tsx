import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { PaymentSession } from '@lavaca/shared';
import { spacing, borderRadius, fontSize, type ThemeColors } from '../../src/constants/theme';
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

function formatCurrency(amount: number, currency: string = 'COP'): string {
  if (currency === 'COP') {
    return '$' + amount.toLocaleString('es-CO');
  }
  return `${currency} ${amount.toLocaleString()}`;
}

function timeAgo(date: Date | string): string {
  const now = new Date().getTime();
  const then = new Date(date).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'ahora';
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
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const renderSession = ({ item }: { item: PaymentSession }) => {
    const myParticipation = item.participants.find((p) => p.userId === user?.id);
    const myAmount = myParticipation?.amount || 0;
    const isAdmin = item.adminId === user?.id;

    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => router.push(`/session/${item.joinCode}` as any)}
      >
        <View style={s.cardHeader}>
          <Text style={s.statusEmoji}>{STATUS_EMOJI[item.status] || '🟢'}</Text>
          <View style={s.cardHeaderInfo}>
            <Text style={s.cardTitle} numberOfLines={1}>
              {item.description || t('history.untitled')}
            </Text>
            <Text style={s.cardTime}>{timeAgo(item.createdAt)}</Text>
          </View>
          <Text style={s.modeEmoji}>{MODE_EMOJI[item.splitMode] || '⚖️'}</Text>
        </View>

        <View style={s.cardBody}>
          <View style={s.stat}>
            <Text style={s.statLabel}>{t('session.total')}</Text>
            <Text style={s.statValue}>{formatCurrency(item.totalAmount, item.currency)}</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statLabel}>{t('history.myPart')}</Text>
            <Text style={[s.statValue, { color: colors.accent }]}>
              {formatCurrency(myAmount, item.currency)}
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
            <Text style={[s.paymentStatus, myParticipation.status === 'confirmed' ? s.paid : s.pending]}>
              {myParticipation.status === 'confirmed' ? t('session.paid') : t('session.pending')}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {sessions.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>📋</Text>
          <Text style={s.emptyText}>{t('history.empty')}</Text>
          <Text style={s.emptyHint}>{t('history.emptyHint')}</Text>
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
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
    emptyIcon: { fontSize: 64, marginBottom: spacing.md },
    emptyText: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
    emptyHint: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center' },
    list: { padding: spacing.md },
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    statusEmoji: { fontSize: 20, marginRight: spacing.sm },
    cardHeaderInfo: { flex: 1 },
    cardTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
    cardTime: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
    modeEmoji: { fontSize: 20 },
    cardBody: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.surfaceBorder,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceBorder,
    },
    stat: { alignItems: 'center', flex: 1 },
    statLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: 2 },
    statValue: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    roleTag: { fontSize: fontSize.sm, color: colors.textSecondary },
    paymentStatus: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.sm,
      overflow: 'hidden',
    },
    paid: { color: '#22c55e', backgroundColor: '#22c55e22' },
    pending: { color: '#f59e0b', backgroundColor: '#f59e0b22' },
  });
