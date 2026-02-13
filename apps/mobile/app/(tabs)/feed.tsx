import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { spacing, borderRadius, fontSize, type ThemeColors } from '../../src/constants/theme';
import { useI18n } from '../../src/i18n';
import { useTheme } from '../../src/theme';
import { api } from '../../src/services/api';
import { FeedEvent } from '@lavaca/shared';

const EVENT_EMOJI: Record<FeedEvent['type'], string> = {
  roulette_win: '🎰',
  roulette_coward: '🐔',
  fast_payer: '⚡',
  session_closed: '✅',
  debt_reminder: '💸',
};

function timeAgo(date: Date | string): string {
  const now = Date.now();
  const d = typeof date === 'string' ? new Date(date).getTime() : date.getTime();
  const diff = Math.floor((now - d) / 1000);

  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function FeedTab() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const s = createStyles(colors);

  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFeed = useCallback(async () => {
    try {
      const data = await api.getFeed();
      setEvents(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFeed();
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>📰</Text>
            <Text style={s.emptyText}>{t('feed.empty')}</Text>
            <Text style={s.emptyHint}>{t('feed.emptyHint')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.eventEmoji}>
                {EVENT_EMOJI[item.type] || '📝'}
              </Text>
              <Text style={s.timeAgo}>
                {timeAgo(item.createdAt)}
              </Text>
            </View>
            <Text style={s.eventMessage}>{item.message}</Text>
          </View>
        )}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    center: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    list: {
      padding: spacing.md,
      paddingBottom: spacing.xxl,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    eventEmoji: {
      fontSize: 22,
    },
    timeAgo: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
    },
    eventMessage: {
      fontSize: fontSize.md,
      color: colors.text,
      lineHeight: 22,
    },
    empty: {
      alignItems: 'center',
      paddingTop: spacing.xxl * 2,
    },
    emptyEmoji: {
      fontSize: 48,
      marginBottom: spacing.md,
    },
    emptyText: {
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    emptyHint: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
