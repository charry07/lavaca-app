import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { spacing, borderRadius, fontSize, type ThemeColors } from '../../src/constants/theme';
import { GlassCard, SkeletonCard, EmptyState, ErrorState } from '../../src/components';
import { useI18n } from '../../src/i18n';
import { useTheme } from '../../src/theme';
import { api } from '../../src/services/api';
import { FeedEvent } from '@lavaca/types';

import { getErrorMessage } from '../../src/utils/errorMessage';
const EVENT_EMOJI: Record<FeedEvent['type'], string> = {
  roulette_win: '🎰',
  roulette_coward: '🐔',
  fast_payer: '⚡',
  session_closed: '✅',
  debt_reminder: '💸',
};

// Left accent strip color per event type
const EVENT_ACCENT: Record<string, string> = {
  roulette_win: '#a78bfa',
  roulette_coward: '#f59e0b',
  fast_payer: '#60a5fa',
  session_closed: '#4ade80',
  debt_reminder: '#f472b6',
};

function timeAgo(date: Date | string): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function FeedTab() {
  const { translate } = useI18n();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadFeed = useCallback(async () => {
    try {
      const data = await api.getFeed();
      setEvents(data);
      setFetchError(null);
    } catch (err: unknown) {
      setFetchError(getErrorMessage(err, translate('common.error')));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [translate]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={{ padding: spacing.md, gap: spacing.sm }}>
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </View>
      </View>
    );
  }

  if (fetchError) {
    return (
      <View style={[styles.container, styles.center]}>
        <ErrorState message={fetchError} onRetry={loadFeed} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadFeed(); }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrapper}>
            <EmptyState emoji="📰" title={translate('feed.empty')} hint={translate('feed.emptyHint')} />
          </View>
        }
        renderItem={({ item }) => (
          <GlassCard style={styles.card}>
            {/* Left accent strip */}
            <View style={[styles.accentStrip, { backgroundColor: EVENT_ACCENT[item.type] || colors.primary }]} />
            <View style={styles.cardInner}>
              <View style={styles.cardHeader}>
                <Text style={styles.eventEmoji}>{EVENT_EMOJI[item.type] || '📝'}</Text>
                <Text style={styles.timeAgo}>{timeAgo(item.createdAt)}</Text>
              </View>
              <Text style={styles.eventMessage}>{item.message}</Text>
            </View>
          </GlassCard>
        )}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { justifyContent: 'center', alignItems: 'center' },
    emptyWrapper: { paddingTop: spacing.xxl * 2, padding: spacing.xl },
    list: { padding: spacing.md, paddingBottom: spacing.xxl },
    card: {
      marginBottom: spacing.sm,
      borderRadius: borderRadius.md,
      flexDirection: 'row',
      overflow: 'hidden',
      padding: 0,
    },
    accentStrip: {
      width: 4,
    },
    cardInner: {
      flex: 1,
      padding: spacing.md,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    eventEmoji: { fontSize: 22 },
    timeAgo: { fontSize: fontSize.xs, color: colors.textMuted },
    eventMessage: { fontSize: fontSize.md, color: colors.text, lineHeight: 22 },
  });
