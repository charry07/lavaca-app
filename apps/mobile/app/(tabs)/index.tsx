import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { PaymentSession } from '@lavaca/shared';
import { spacing, borderRadius, fontSize, type ThemeColors } from '../../src/constants/theme';
import { formatCOP } from '@lavaca/shared';
import { useI18n } from '../../src/i18n';
import { useTheme } from '../../src/theme';
import { VacaLogo } from '../../src/components/VacaLogo';
import { HeaderControls } from '../../src/components/HeaderControls';
import { useAuth } from '../../src/auth';
import { api } from '../../src/services/api';

export default function HomeTab() {
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useTheme();
  const { user } = useAuth();
  const s = createStyles(colors);

  const [sessions, setSessions] = useState<PaymentSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed' | 'pending' | 'cancelled'>('all');

  const loadSessions = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setLoadingSessions(true);
    try {
      const data = await api.getUserHistory(user.id);
      setSessions(data);
    } catch {
      // silently ignore — API might not be running
    } finally {
      setLoadingSessions(false);
      setRefreshing(false);
    }
  }, [user]);

  // Refetch sessions every time this tab is focused
  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions])
  );

  const renderSessionCard = ({ item }: { item: PaymentSession }) => {
    const participantCount = item.participants.length;
    const isOpen = item.status === 'open';
    const hasPendingApproval = item.participants.some((p) => p.status === 'reported');
    return (
      <TouchableOpacity
        style={s.sessionCard}
        onPress={() => router.push(`/session/${item.joinCode}`)}
        activeOpacity={0.7}
      >
        <View style={s.sessionCardHeader}>
          <Text style={s.sessionCardTitle} numberOfLines={1}>
            {item.description || t('history.untitled')}
          </Text>
          <View style={s.badgeRow}>
            {hasPendingApproval && (
              <View style={s.pendingBadge}>
                <Text style={s.pendingBadgeText}>{t('home.pendingApproval')}</Text>
              </View>
            )}
            <View
              style={[
                s.statusBadge,
                isOpen ? s.statusOpen : item.status === 'closed' ? s.statusClosed : s.statusCancelled,
              ]}
            >
              <Text
                style={[
                  s.statusText,
                  isOpen ? s.statusTextOpen : item.status === 'closed' ? s.statusTextClosed : s.statusTextCancelled,
                ]}
              >
                {isOpen
                  ? t('home.open')
                  : item.status === 'closed'
                    ? t('home.closed')
                    : t('home.cancelled')}
              </Text>
            </View>
          </View>
        </View>
        <View style={s.sessionCardBody}>
          <Text style={s.sessionAmount}>{formatCOP(item.totalAmount)}</Text>
          <Text style={s.sessionMeta}>
            {participantCount} {participantCount === 1 ? t('common.person') : t('common.people')} · {item.joinCode}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const filteredSessions = sessions.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return item.participants.some((p) => p.status === 'reported');
    return item.status === filter;
  });

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={s.container}
      data={filteredSessions}
      keyExtractor={(item) => item.id}
      renderItem={renderSessionCard}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); loadSessions(true); }}
          tintColor={colors.primary}
        />
      }
      ListHeaderComponent={
        <>
          <View style={s.header}>
            <HeaderControls />
          </View>

          <View style={s.hero}>
            <VacaLogo size="lg" style={{ marginTop: spacing.md }} />
            <Text style={s.tagline}>{t('home.tagline')}</Text>
          </View>

          <View style={s.actions}>
            <TouchableOpacity style={s.button} onPress={() => router.push('/create')}>
              <Text style={s.buttonText}>{t('home.createTable')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.button, s.buttonSecondary]}
              onPress={() => router.push('/join')}
            >
              <Text style={[s.buttonText, s.buttonTextSecondary]}>
                {t('home.joinTable')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Section title for sessions list */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>{t('home.myTables')}</Text>
            {loadingSessions && <ActivityIndicator size="small" color={colors.accent} />}
          </View>

          <View style={s.filtersRow}>
            <TouchableOpacity
              style={[s.filterChip, filter === 'all' && s.filterChipActive]}
              onPress={() => setFilter('all')}
            >
              <Text style={[s.filterChipText, filter === 'all' && s.filterChipTextActive]}>
                {t('home.filterAll')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.filterChip, filter === 'open' && s.filterChipActive]}
              onPress={() => setFilter('open')}
            >
              <Text style={[s.filterChipText, filter === 'open' && s.filterChipTextActive]}>
                {t('home.filterOpen')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.filterChip, filter === 'closed' && s.filterChipActive]}
              onPress={() => setFilter('closed')}
            >
              <Text style={[s.filterChipText, filter === 'closed' && s.filterChipTextActive]}>
                {t('home.filterClosed')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.filterChip, filter === 'pending' && s.filterChipActive]}
              onPress={() => setFilter('pending')}
            >
              <Text style={[s.filterChipText, filter === 'pending' && s.filterChipTextActive]}>
                {t('home.filterPending')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.filterChip, filter === 'cancelled' && s.filterChipActive]}
              onPress={() => setFilter('cancelled')}
            >
              <Text style={[s.filterChipText, filter === 'cancelled' && s.filterChipTextActive]}>
                {t('home.filterCancelled')}
              </Text>
            </TouchableOpacity>
          </View>

          {!loadingSessions && filteredSessions.length === 0 && (
            <View style={s.emptyContainer}>
              <Text style={s.emptyText}>🐄</Text>
              <Text style={s.emptyLabel}>{t('home.noTables')}</Text>
              <Text style={s.emptyHint}>{t('home.noTablesHint')}</Text>
            </View>
          )}
        </>
      }
    />
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    header: {
      alignItems: 'flex-end',
      marginBottom: spacing.lg,
    },
    hero: {
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    tagline: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    actions: {
      marginBottom: spacing.xl,
    },
    button: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      marginBottom: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.md,
      alignItems: 'center',
    },
    buttonText: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: colors.background,
    },
    buttonSecondary: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: colors.primary,
    },
    buttonTextSecondary: {
      color: colors.primary,
    },
    // ── Sessions section ──
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    filtersRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginBottom: spacing.md,
    },
    filterChip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    filterChipActive: {
      backgroundColor: colors.primary + '22',
      borderColor: colors.primary,
    },
    filterChipText: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    filterChipTextActive: {
      color: colors.primary,
    },
    sectionTitle: {
      fontSize: fontSize.xl,
      fontWeight: '700',
      color: colors.text,
    },
    sessionCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    sessionCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    sessionCardTitle: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      marginRight: spacing.sm,
    },
    pendingBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.sm,
      backgroundColor: '#f59e0b20',
      borderWidth: 1,
      borderColor: '#f59e0b',
    },
    pendingBadgeText: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: '#f59e0b',
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.sm,
    },
    statusOpen: {
      backgroundColor: '#22c55e20',
    },
    statusClosed: {
      backgroundColor: '#ef444420',
    },
    statusCancelled: {
      backgroundColor: '#64748b20',
    },
    statusText: {
      fontSize: fontSize.xs,
      fontWeight: '600',
    },
    statusTextOpen: {
      color: '#22c55e',
    },
    statusTextClosed: {
      color: '#ef4444',
    },
    statusTextCancelled: {
      color: '#64748b',
    },
    sessionCardBody: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sessionAmount: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: colors.accent,
    },
    sessionMeta: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
    },
    // ── Empty state ──
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    emptyText: {
      fontSize: 48,
      marginBottom: spacing.sm,
    },
    emptyLabel: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    emptyHint: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
      textAlign: 'center',
    },
  });
