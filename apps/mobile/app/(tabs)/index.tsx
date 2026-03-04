import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { PaymentSession } from '@lavaca/shared';
import { spacing, borderRadius, fontSize, fontWeight, type ThemeColors } from '../../src/constants/theme';
import { formatCOP } from '@lavaca/shared';
import { GlassCard, SkeletonCard, ErrorState } from '../../src/components';
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
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed' | 'pending' | 'cancelled'>('all');

  const loadSessions = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setLoadingSessions(true);
    try {
      const data = await api.getUserHistory(user.id);
      setSessions(data);
      setFetchError(null);
    } catch (err: any) {
      setFetchError(err.message || t('common.error'));
    } finally {
      setLoadingSessions(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions])
  );

  const renderSessionCard = ({ item }: { item: PaymentSession }) => {
    const participantCount = item.participants.length;
    const isOpen = item.status === 'open';
    const isClosed = item.status === 'closed';
    const hasPendingApproval = item.participants.some((p) => p.status === 'reported');

    const statusColor = isOpen ? colors.statusOpen : isClosed ? colors.statusClosed : colors.statusCancelled;
    const statusBg = isOpen ? colors.statusOpenBg : isClosed ? colors.statusClosedBg : colors.statusCancelledBg;
    const statusLabel = isOpen ? t('home.open') : isClosed ? t('home.closed') : t('home.cancelled');

    return (
      <TouchableOpacity onPress={() => router.push(`/session/${item.joinCode}`)} activeOpacity={0.7}>
        <GlassCard style={s.sessionCard}>
          <View style={s.sessionCardHeader}>
            <Text style={s.sessionCardTitle} numberOfLines={1}>
              {item.description || t('history.untitled')}
            </Text>
            <View style={s.badgeRow}>
              {hasPendingApproval && (
                <View style={[s.badge, { backgroundColor: colors.statusPendingBg, borderColor: colors.statusPending }]}>
                  <Text style={[s.badgeText, { color: colors.statusPending }]}>{t('home.pendingApproval')}</Text>
                </View>
              )}
              <View style={[s.badge, { backgroundColor: statusBg }]}>
                <Text style={[s.badgeText, { color: statusColor }]}>{statusLabel}</Text>
              </View>
            </View>
          </View>
          <View style={s.sessionCardBody}>
            <Text style={s.sessionAmount}>{formatCOP(item.totalAmount)}</Text>
            <Text style={s.sessionMeta}>
              {participantCount} {participantCount === 1 ? t('common.person') : t('common.people')} · {item.joinCode}
            </Text>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  const filteredSessions = sessions.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return item.participants.some((p) => p.status === 'reported');
    return item.status === filter;
  });

  const FILTERS: { key: typeof filter; label: string }[] = [
    { key: 'all', label: t('home.filterAll') },
    { key: 'open', label: t('home.filterOpen') },
    { key: 'closed', label: t('home.filterClosed') },
    { key: 'pending', label: t('home.filterPending') },
    { key: 'cancelled', label: t('home.filterCancelled') },
  ];

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
            <TouchableOpacity
              style={{ borderRadius: borderRadius.md, overflow: 'hidden', marginBottom: spacing.md }}
              onPress={() => router.push('/create')}
            >
              <LinearGradient
                colors={[colors.primary, colors.accent || colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.button}
              >
                <Text style={s.buttonText}>{t('home.createTable')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={s.buttonSecondary} onPress={() => router.push('/join')}>
              <Text style={s.buttonTextSecondary}>{t('home.joinTable')}</Text>
            </TouchableOpacity>
          </View>

          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>{t('home.myTables')}</Text>
          </View>

          <View style={s.filtersRow}>
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[s.filterChip, filter === f.key && s.filterChipActive]}
                onPress={() => setFilter(f.key)}
              >
                <Text style={[s.filterChipText, filter === f.key && s.filterChipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loadingSessions && (
            <View style={{ gap: spacing.sm }}>
              {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
            </View>
          )}

          {!loadingSessions && fetchError && (
            <ErrorState message={fetchError} onRetry={() => loadSessions()} />
          )}

          {!loadingSessions && !fetchError && filteredSessions.length === 0 && (
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
      marginTop: spacing.sm,
    },
    actions: {
      marginBottom: spacing.xl,
    },
    button: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.md,
      alignItems: 'center',
    },
    buttonText: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: '#fff',
    },
    buttonSecondary: {
      backgroundColor: colors.glass,
      borderWidth: 1.5,
      borderColor: colors.primary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.md,
      alignItems: 'center',
    },
    buttonTextSecondary: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.semibold,
      color: colors.primary,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: colors.text,
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
      backgroundColor: colors.glass,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    filterChipActive: {
      backgroundColor: colors.primary + '22',
      borderColor: colors.primary,
    },
    filterChipText: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      color: colors.textSecondary,
    },
    filterChipTextActive: {
      color: colors.primary,
    },
    sessionCard: {
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderRadius: borderRadius.lg,
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
      fontWeight: fontWeight.semibold,
      color: colors.text,
      flex: 1,
      marginRight: spacing.sm,
    },
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.sm,
      borderWidth: 1,
    },
    badgeText: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.bold,
    },
    sessionCardBody: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sessionAmount: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: colors.accent,
    },
    sessionMeta: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
    },
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
      fontWeight: fontWeight.semibold,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    emptyHint: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
      textAlign: 'center',
    },
  });
