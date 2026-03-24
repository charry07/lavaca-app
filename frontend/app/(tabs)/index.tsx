import {useState, useCallback} from "react";
import {View, Text, TouchableOpacity, StyleSheet, FlatList, RefreshControl} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {useRouter} from "expo-router";
import {useFocusEffect} from "@react-navigation/native";
import {PaymentSession, formatCOP} from "@lavaca/types";
import {spacing, borderRadius, fontSize, fontWeight, type ThemeColors} from "../../src/constants/theme";
import {SkeletonCard, ErrorState, Avatar, StatusPill, AnimatedCard, SplitBar, VacaLogo, HeaderControls} from "../../src/components";
import {useI18n} from "../../src/i18n";
import {useTheme} from "../../src/theme";
import {useAuth} from "../../src/auth";
import {api} from "../../src/services/api";
import {getSessionAccentColor, getSessionPillVariant} from "../../src/utils/sessionStatus";

import {getErrorMessage} from "../../src/utils/errorMessage";
export default function HomeTab() {
  const router = useRouter();
  const {translate} = useI18n();
  const {colors} = useTheme();
  const {user} = useAuth();
  const styles = createStyles(colors);

  const [sessions, setSessions] = useState<PaymentSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "closed" | "pending" | "cancelled">("all");

  const loadSessions = useCallback(
    async (silent = false) => {
      if (!user) return;
      if (!silent) setLoadingSessions(true);
      try {
        const data = await api.getUserHistory(user.id);
        setSessions(data);
        setFetchError(null);
      } catch (err: unknown) {
        setFetchError(getErrorMessage(err, translate("common.error")));
      } finally {
        setLoadingSessions(false);
        setRefreshing(false);
      }
    },
    [translate, user],
  );

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions]),
  );

  const renderSessionCard = ({item, index}: {item: PaymentSession; index: number}) => {
    const participantCount = item.participants.length;
    const hasPendingApproval = item.participants.some((p) => p.status === "reported");
    const statusPillVariant = getSessionPillVariant(item.status);
    const statusLabel = item.status === "open" ? translate("common.open") : item.status === "closed" ? translate("common.closed") : translate("home.cancelled");
    const accentBar = getSessionAccentColor(item.status, colors);

    const confirmedCount = item.participants.filter((p) => p.status === "confirmed").length;
    const adminName = item.participants.find((p) => p.userId === item.adminId)?.displayName || item.description || "?";

    return (
      <TouchableOpacity onPress={() => router.push(`/session/${item.joinCode}`)} activeOpacity={0.75}>
        <AnimatedCard index={index} style={{...styles.sessionCard, borderLeftColor: accentBar}}>
          <View style={styles.sessionCardHeader}>
            <View style={styles.sessionAvatar}>
              <Avatar displayName={adminName} size={36} />
            </View>
            <Text style={styles.sessionCardTitle} numberOfLines={1}>
              {item.description || translate("history.untitled")}
            </Text>
            <View style={styles.badgeRow}>
              {hasPendingApproval && <StatusPill variant='warning' label='⏳' />}
              <StatusPill variant={statusPillVariant} label={statusLabel} />
            </View>
          </View>
          <View style={styles.sessionCardBody}>
            <Text style={styles.sessionAmount}>{formatCOP(item.totalAmount)}</Text>
            <Text style={styles.sessionMeta}>
              {participantCount} {participantCount === 1 ? translate("common.person") : translate("common.people")} · {item.joinCode}
            </Text>
          </View>
          <View style={styles.sessionCardFooter}>
            <SplitBar paid={confirmedCount} total={participantCount} amount={item.totalAmount} currency={item.currency} />
          </View>
        </AnimatedCard>
      </TouchableOpacity>
    );
  };

  const filteredSessions = sessions.filter((item) => {
    if (filter === "all") return true;
    if (filter === "pending") return item.participants.some((p) => p.status === "reported");
    return item.status === filter;
  });

  const FILTERS: {key: typeof filter; label: string}[] = [
    {key: "all", label: translate("home.filterAll")},
    {key: "open", label: translate("home.filterOpen")},
    {key: "closed", label: translate("home.filterClosed")},
    {key: "pending", label: translate("home.filterPending")},
    {key: "cancelled", label: translate("home.filterCancelled")},
  ];

  return (
    <FlatList
      style={{flex: 1, backgroundColor: colors.background}}
      contentContainerStyle={styles.container}
      data={filteredSessions}
      keyExtractor={(item) => item.id}
      renderItem={({item, index}) => renderSessionCard({item, index})}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadSessions(true);
          }}
          tintColor={colors.primary}
        />
      }
      ListHeaderComponent={
        <>
          <View style={styles.header}>
            <HeaderControls />
          </View>

          <View style={styles.hero}>
            <VacaLogo size='lg' style={{marginTop: spacing.md}} />
            <Text style={styles.tagline}>{translate("home.tagline")}</Text>
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.createButtonWrap} onPress={() => router.push("/create")} activeOpacity={0.85}>
              <LinearGradient colors={[colors.primary, colors.primaryDark]} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.createButton}>
                <Text style={styles.createButtonIcon}>🍽️</Text>
                <Text style={styles.createButtonText}>{translate("home.createTable")}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.joinButton} onPress={() => router.push("/join")} activeOpacity={0.8}>
              <Text style={styles.joinButtonIcon}>🔗</Text>
              <Text style={styles.joinButtonText}>{translate("home.joinTable")}</Text>
            </TouchableOpacity>
          </View>

          {/* Section header */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{translate("home.myTables")}</Text>
            {sessions.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{sessions.length}</Text>
              </View>
            )}
          </View>

          {/* Filter chips */}
          <View style={styles.filtersRow}>
            {FILTERS.map((f) => (
              <TouchableOpacity key={f.key} style={[styles.filterChip, filter === f.key && styles.filterChipActive]} onPress={() => setFilter(f.key)}>
                <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {loadingSessions && (
            <View style={{gap: spacing.sm}}>
              {[0, 1, 2].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </View>
          )}

          {!loadingSessions && fetchError && <ErrorState message={fetchError} onRetry={() => loadSessions()} />}

          {!loadingSessions && !fetchError && filteredSessions.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🐄</Text>
              <Text style={styles.emptyLabel}>{translate("home.noTables")}</Text>
              <Text style={styles.emptyHint}>{translate("home.noTablesHint")}</Text>
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
      paddingHorizontal: spacing.md,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    header: {
      alignItems: "flex-end",
      marginBottom: spacing.lg,
    },
    hero: {
      alignItems: "center",
      marginBottom: spacing.xl,
    },
    tagline: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
      marginTop: spacing.sm,
    },
    actions: {
      marginBottom: spacing.xl,
      gap: spacing.sm,
    },
    createButtonWrap: {
      borderRadius: borderRadius.md,
      overflow: "hidden",
    },
    createButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.md + 2,
      gap: spacing.sm,
    },
    createButtonIcon: {fontSize: 18},
    createButtonText: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.bold,
      color: colors.background,
      letterSpacing: 0.2,
    },
    joinButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.primary + "50",
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      gap: spacing.sm,
    },
    joinButtonIcon: {fontSize: 18},
    joinButtonText: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: colors.primary,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    sectionTitle: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: colors.text,
      letterSpacing: -0.2,
    },
    countBadge: {
      backgroundColor: colors.surface2,
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    countBadgeText: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.bold,
      color: colors.textMuted,
    },
    filtersRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
      marginBottom: spacing.md,
    },
    filterChip: {
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 5,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    filterChipActive: {
      backgroundColor: colors.primary + "18",
      borderColor: colors.primary + "60",
    },
    filterChipText: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      color: colors.textMuted,
    },
    filterChipTextActive: {
      color: colors.primary,
    },
    // Session card — warm surface with colored left-border accent bar (signature)
    // AnimatedCard provides background; we override padding, borderRadius, and left border
    sessionCard: {
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderLeftWidth: 3,
    },
    sessionAvatar: {
      marginRight: spacing.sm,
    },
    sessionCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.xs,
    },
    badgeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      marginLeft: spacing.xs,
    },
    sessionCardTitle: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: colors.text,
      flex: 1,
      marginRight: spacing.xs,
    },
    sessionCardBody: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
    },
    sessionAmount: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: colors.accent,
      letterSpacing: -0.2,
    },
    sessionMeta: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
    },
    sessionCardFooter: {
      marginTop: spacing.xs,
    },
    emptyContainer: {
      alignItems: "center",
      paddingVertical: spacing.xxl,
    },
    emptyEmoji: {
      fontSize: 44,
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
      textAlign: "center",
      lineHeight: 20,
    },
  });
