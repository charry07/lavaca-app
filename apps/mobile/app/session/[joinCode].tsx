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
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { PaymentSession, Participant, formatCOP } from '@lavaca/shared';
import { api } from '../../src/services/api';
import { colors, spacing, borderRadius, fontSize } from '../../src/constants/theme';

export default function SessionScreen() {
  const { joinCode } = useLocalSearchParams<{ joinCode: string }>();
  const [session, setSession] = useState<PaymentSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [splitting, setSplitting] = useState(false);

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
      setSession(updated);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSplitting(false);
    }
  };

  const handleShare = async () => {
    if (!joinCode) return;
    try {
      await Share.share({
        message: `Unete a La Vaca! 🐄\n\nCodigo: ${joinCode}\n\nDescarga la app para dividir y pagar la cuenta facilmente.`,
      });
    } catch {}
  };

  const handleMarkPaid = async (userId: string) => {
    if (!joinCode) return;
    try {
      const updated = await api.markPaid(joinCode, { userId, paymentMethod: 'nequi' });
      setSession(updated);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Mesa no encontrada</Text>
      </View>
    );
  }

  const paidCount = session.participants.filter((p) => p.status === 'confirmed').length;
  const totalCount = session.participants.length;
  const allSplit = session.participants.some((p) => p.amount > 0);

  const getModeLabel = () => {
    switch (session.splitMode) {
      case 'equal': return '⚖️ Partes iguales';
      case 'percentage': return '📊 Porcentajes';
      case 'roulette': return '🎰 Ruleta';
    }
  };

  const renderParticipant = ({ item }: { item: Participant }) => {
    const isPaid = item.status === 'confirmed';
    const isWinner = item.isRouletteWinner;

    return (
      <View style={[styles.participantCard, isPaid && styles.participantPaid]}>
        <View style={styles.participantInfo}>
          <Text style={styles.participantName}>
            {item.displayName}
            {isWinner ? ' 🎰' : ''}
          </Text>
          <Text style={styles.participantStatus}>
            {isPaid ? '✅ Pagado' : '⏳ Pendiente'}
          </Text>
        </View>
        <View style={styles.participantRight}>
          <Text style={[styles.participantAmount, isPaid && styles.amountPaid]}>
            {formatCOP(item.amount)}
          </Text>
          {!isPaid && item.amount > 0 && (
            <TouchableOpacity
              style={styles.payButton}
              onPress={() => handleMarkPaid(item.userId)}
            >
              <Text style={styles.payButtonText}>Pagar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Session Header */}
      <View style={styles.header}>
        <View style={styles.codeRow}>
          <Text style={styles.joinCodeLabel}>Codigo:</Text>
          <Text style={styles.joinCode}>{session.joinCode}</Text>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Text style={styles.shareButtonText}>Compartir</Text>
          </TouchableOpacity>
        </View>

        {session.description && (
          <Text style={styles.description}>{session.description}</Text>
        )}

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatCOP(session.totalAmount)}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totalCount}</Text>
            <Text style={styles.statLabel}>Personas</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{getModeLabel()}</Text>
            <Text style={styles.statLabel}>Modo</Text>
          </View>
        </View>

        {/* Progress bar */}
        {allSplit && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${totalCount > 0 ? (paidCount / totalCount) * 100 : 0}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {paidCount}/{totalCount} pagaron
            </Text>
          </View>
        )}
      </View>

      {/* Participants List */}
      <FlatList
        data={session.participants}
        keyExtractor={(item) => item.userId}
        renderItem={renderParticipant}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>👥</Text>
            <Text style={styles.emptyText}>
              Aun no hay participantes.{'\n'}Comparte el codigo para que se unan!
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
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.splitButton, splitting && styles.splitButtonDisabled]}
            onPress={handleSplit}
            disabled={splitting}
          >
            {splitting ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.splitButtonText}>
                Dividir Cuenta 🐄
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {session.status === 'closed' && (
        <View style={styles.closedBanner}>
          <Text style={styles.closedText}>🎉 Todos pagaron! Cuenta cerrada</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
    gap: spacing.sm,
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
});
