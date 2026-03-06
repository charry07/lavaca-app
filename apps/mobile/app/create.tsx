import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  FlatList,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SplitMode, User } from '@lavaca/shared';
import { api } from '../src/services/api';
import { spacing, borderRadius, fontSize, fontWeight, type ThemeColors } from '../src/constants/theme';
import { useI18n } from '../src/i18n';
import { useTheme } from '../src/theme';
import { useAuth } from '../src/auth';
import { useToast } from '../src/components';

import { getErrorMessage } from '../src/utils/errorMessage';
export default function CreateScreen() {
  const router = useRouter();
  const { translate } = useI18n();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { showError } = useToast();
  const styles = createStyles(colors);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [currency, setCurrency] = useState<'COP' | 'USD' | 'EUR'>('COP');
  const [loading, setLoading] = useState(false);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [participantSearchQuery, setParticipantSearchQuery] = useState('');
  const [participantResults, setParticipantResults] = useState<User[]>([]);
  const [frequentParticipants, setFrequentParticipants] = useState<User[]>([]);
  const [suggestedParticipants, setSuggestedParticipants] = useState<User[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<User[]>([]);
  const [loadingFrequent, setLoadingFrequent] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const CURRENCIES: { key: 'COP' | 'USD' | 'EUR'; symbol: string }[] = [
    { key: 'COP', symbol: '🇨🇴 COP' },
    { key: 'USD', symbol: '🇺🇸 USD' },
    { key: 'EUR', symbol: '🇪🇺 EUR' },
  ];

  const SPLIT_MODES: { key: SplitMode; label: string; emoji: string; desc: string }[] = [
    { key: 'equal', label: translate('create.equalParts'), emoji: '⚖️', desc: 'Todos pagan igual' },
    { key: 'percentage', label: translate('create.percentage'), emoji: '📊', desc: 'Por porcentaje' },
    { key: 'roulette', label: translate('create.roulette'), emoji: '🎰', desc: 'A la suerte' },
  ];

  const handleCreate = async () => {
    const numAmount = Number(amount.replace(/[^0-9]/g, ''));
    if (!numAmount || numAmount <= 0) {
      showError(translate('create.invalidAmount'));
      return;
    }

    setLoading(true);
    try {
      const session = await api.createSession({
        adminId: user?.id || 'anonymous',
        totalAmount: numAmount,
        currency,
        splitMode,
        description: description || undefined,
      });

      if (selectedParticipants.length > 0) {
        await Promise.allSettled(
          selectedParticipants.map((participant) =>
            api.joinSession(session.joinCode, {
              userId: participant.id,
              displayName: participant.displayName,
            })
          )
        );
      }

      router.push(`/session/${session.joinCode}`);
    } catch (err: unknown) {
      showError(getErrorMessage(err, translate('create.errorCreating')));
    } finally {
      setLoading(false);
    }
  };

  const openAddParticipantModal = async () => {
    setShowAddParticipantModal(true);
    setParticipantSearchQuery('');
    setParticipantResults([]);
    setSuggestedParticipants([]);

    if (!user?.id) { setFrequentParticipants([]); return; }

    setLoadingFrequent(true);
    try {
      const frequent = await api.getFrequentUsers(user.id, 7);
      const frequentSlice = frequent.slice(0, 7);
      setFrequentParticipants(frequentSlice);

      // Fill remaining slots (up to 7 total) with random users
      const remaining = 7 - frequentSlice.length;
      if (remaining > 0) {
        const excludeIds = [user.id, ...frequentSlice.map((u) => u.id)];
        const random = await api.getRandomUsers(remaining, excludeIds);
        setSuggestedParticipants(random);
      }
    } catch {
      setFrequentParticipants([]);
      setSuggestedParticipants([]);
    } finally {
      setLoadingFrequent(false);
    }
  };

  const toggleParticipant = (foundUser: User) => {
    setSelectedParticipants((prev) => {
      const exists = prev.some((p) => p.id === foundUser.id);
      if (exists) return prev.filter((p) => p.id !== foundUser.id);
      return [...prev, foundUser];
    });
  };

  const selectedIds = new Set(selectedParticipants.map((p) => p.id));

  const frequentRank = useMemo(
    () => new Map(frequentParticipants.map((p, i) => [p.id, i])),
    [frequentParticipants]
  );

  const isSearching = participantSearchQuery.trim().length >= 2;
  const displayedParticipants = isSearching
    ? participantResults
    : [...frequentParticipants, ...suggestedParticipants];

  useEffect(() => {
    if (!showAddParticipantModal) return;
    const query = participantSearchQuery.trim();
    if (query.length < 2) { setParticipantResults([]); setSearchingUsers(false); return; }

    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const results = await api.searchUsers(query);
        const filtered = results.filter((r) => r.id !== user?.id);
        const sorted = [...filtered].sort((a, b) => {
          const ra = frequentRank.has(a.id) ? (frequentRank.get(a.id) as number) : Infinity;
          const rb = frequentRank.has(b.id) ? (frequentRank.get(b.id) as number) : Infinity;
          if (ra !== rb) return ra - rb;
          return a.displayName.localeCompare(b.displayName);
        });
        setParticipantResults(sorted.slice(0, 7));
      } catch {
        setParticipantResults([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [participantSearchQuery, showAddParticipantModal, user?.id, frequentRank]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Amount input — hero field */}
        <View style={styles.amountSection}>
          <Text style={styles.sectionLabel}>{translate('create.totalAmount')}</Text>
          <View style={styles.amountInputWrap}>
            <Text style={styles.amountCurrencySymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
          </View>
        </View>

        {/* Description */}
        <Text style={styles.sectionLabel}>{translate('create.description')}</Text>
        <TextInput
          style={styles.input}
          placeholder={translate('create.descriptionPlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
        />

        {/* Currency selector */}
        <Text style={styles.sectionLabel}>{translate('create.currency')}</Text>
        <View style={styles.pillRow}>
          {CURRENCIES.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={[styles.currencyPill, currency === c.key && styles.currencyPillActive]}
              onPress={() => setCurrency(c.key)}
            >
              <Text style={[styles.currencyPillText, currency === c.key && styles.currencyPillTextActive]}>
                {c.symbol}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Split mode selector */}
        <Text style={styles.sectionLabel}>{translate('create.howToSplit')}</Text>
        <View style={styles.modeRow}>
          {SPLIT_MODES.map((mode) => (
            <TouchableOpacity
              key={mode.key}
              style={[styles.modeCard, splitMode === mode.key && styles.modeCardActive]}
              onPress={() => setSplitMode(mode.key)}
            >
              {splitMode === mode.key && (
                <View style={styles.modeActiveBar} />
              )}
              <Text style={styles.modeEmoji}>{mode.emoji}</Text>
              <Text style={[styles.modeLabel, splitMode === mode.key && styles.modeLabelActive]}>
                {mode.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Add participants */}
        <TouchableOpacity style={styles.addParticipantButton} onPress={openAddParticipantModal}>
          <Text style={styles.addParticipantIcon}>+</Text>
          <Text style={styles.addParticipantText}>{translate('session.addParticipants')}</Text>
          {selectedParticipants.length > 0 && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>{selectedParticipants.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Create button */}
        <TouchableOpacity
          style={[styles.createButtonWrap, loading && { opacity: 0.55 }]}
          onPress={handleCreate}
          disabled={loading}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.createButton}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.createButtonText}>{translate('create.createButton')}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>

      {/* Add Participants Modal */}
      <Modal
        visible={showAddParticipantModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddParticipantModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHandle} />
            <View style={styles.searchModalHeader}>
              <Text style={styles.modalTitle}>{translate('session.addParticipants')}</Text>
              <TouchableOpacity onPress={() => setShowAddParticipantModal(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder={translate('session.searchPeoplePlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={participantSearchQuery}
              onChangeText={setParticipantSearchQuery}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Selected participants chips */}
            {selectedParticipants.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipsScroll}
                contentContainerStyle={styles.chipsContainer}
                keyboardShouldPersistTaps="handled"
              >
                {selectedParticipants.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.chip}
                    onPress={() => toggleParticipant(p)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.chipAvatar}>
                      <Text style={styles.chipAvatarText}>{p.displayName.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.chipName} numberOfLines={1}>{p.displayName.split(' ')[0]}</Text>
                    <Text style={styles.chipRemove}>×</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {(loadingFrequent || (searchingUsers && isSearching)) && (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
            )}
            {!loadingFrequent && !searchingUsers && isSearching && displayedParticipants.length === 0 && (
              <Text style={styles.searchHintText}>{translate('session.noUserResults')}</Text>
            )}

            {!loadingFrequent && !isSearching && (
              <FlatList
                data={[
                  ...(frequentParticipants.length > 0
                    ? [{ type: 'label', id: '__recent__', label: translate('create.frequentPeopleHint') }, ...frequentParticipants.map((u) => ({ type: 'user', ...u }))]
                    : []),
                  ...(suggestedParticipants.length > 0
                    ? [{ type: 'label', id: '__suggested__', label: translate('create.suggestedPeople') }, ...suggestedParticipants.map((u) => ({ type: 'user', ...u }))]
                    : []),
                ] as any[]}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  if (item.type === 'label') {
                    return <Text style={styles.searchSectionLabel}>{item.label}</Text>;
                  }
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <TouchableOpacity
                      style={[styles.userRow, isSelected && styles.userRowSelected]}
                      onPress={() => toggleParticipant(item as User)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.avatar, isSelected && { backgroundColor: colors.primary }]}>
                        <Text style={styles.avatarText}>{item.displayName.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{item.displayName}</Text>
                        <Text style={styles.userMeta}>@{item.username}</Text>
                      </View>
                      <View style={[styles.checkCircle, isSelected && styles.checkCircleActive]}>
                        {isSelected && <Text style={styles.checkMark}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            {!loadingFrequent && isSearching && (
              <FlatList
                data={displayedParticipants}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item: foundUser }) => {
                  const isSelected = selectedIds.has(foundUser.id);
                  return (
                    <TouchableOpacity
                      style={[styles.userRow, isSelected && styles.userRowSelected]}
                      onPress={() => toggleParticipant(foundUser)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.avatar, isSelected && { backgroundColor: colors.primary }]}>
                        <Text style={styles.avatarText}>{foundUser.displayName.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{foundUser.displayName}</Text>
                        <Text style={styles.userMeta}>@{foundUser.username}</Text>
                      </View>
                      <View style={[styles.checkCircle, isSelected && styles.checkCircleActive]}>
                        {isSelected && <Text style={styles.checkMark}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
    // Amount hero section
    amountSection: {
      backgroundColor: colors.surface2,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      alignItems: 'center',
    },
    sectionLabel: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      color: colors.textMuted,
      marginBottom: spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    amountInputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    amountCurrencySymbol: {
      fontSize: fontSize.xxl,
      fontWeight: fontWeight.bold,
      color: colors.textMuted,
    },
    amountInput: {
      fontSize: fontSize.xxl + 8,
      fontWeight: fontWeight.bold,
      color: colors.accent,
      minWidth: 120,
      textAlign: 'center',
    },
    input: {
      fontSize: fontSize.md,
      color: colors.text,
      backgroundColor: colors.surface2,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      marginBottom: spacing.lg,
    },
    pillRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    currencyPill: {
      flex: 1,
      backgroundColor: colors.surface2,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm + 2,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    currencyPillActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '14',
    },
    currencyPillText: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      fontWeight: fontWeight.semibold,
    },
    currencyPillTextActive: {
      color: colors.primary,
    },
    modeRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    modeCard: {
      flex: 1,
      backgroundColor: colors.surface2,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      overflow: 'hidden',
      position: 'relative',
    },
    modeCardActive: {
      borderColor: colors.primary + '60',
      backgroundColor: colors.primary + '0e',
    },
    // Active bar — thin top accent line (signature element variant)
    modeActiveBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: colors.primary,
    },
    modeEmoji: { fontSize: 26, marginBottom: spacing.xs },
    modeLabel: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      textAlign: 'center',
      fontWeight: fontWeight.medium,
    },
    modeLabelActive: {
      color: colors.primary,
      fontWeight: fontWeight.semibold,
    },
    addParticipantButton: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.primary + '50',
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surface2,
      marginBottom: spacing.lg,
      gap: spacing.sm,
    },
    addParticipantIcon: {
      fontSize: fontSize.xl,
      color: colors.primary,
      fontWeight: fontWeight.bold,
      lineHeight: fontSize.xl,
    },
    addParticipantText: {
      flex: 1,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: colors.primary,
    },
    selectedBadge: {
      backgroundColor: colors.primary,
      borderRadius: borderRadius.full,
      width: 22,
      height: 22,
      justifyContent: 'center',
      alignItems: 'center',
    },
    selectedBadgeText: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.bold,
      color: colors.background,
    },
    createButtonWrap: {
      borderRadius: borderRadius.md,
      overflow: 'hidden',
    },
    createButton: {
      paddingVertical: spacing.md + 2,
      borderRadius: borderRadius.md,
      alignItems: 'center',
    },
    createButtonText: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.bold,
      color: colors.background,
      letterSpacing: 0.2,
    },
    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    modalContent: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '75%',
      paddingBottom: spacing.xxl,
      paddingHorizontal: spacing.lg,
    },
    modalHandle: {
      width: 40,
      height: 4,
      backgroundColor: colors.surfaceBorder,
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: spacing.sm,
      marginBottom: spacing.md,
    },
    searchModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    modalTitle: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: colors.text,
    },
    modalCloseBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.surface2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalCloseBtnText: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
    },
    searchInput: {
      backgroundColor: colors.surface2,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: fontSize.md,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      marginBottom: spacing.sm,
    },
    searchHintText: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
      textAlign: 'center',
      paddingVertical: spacing.md,
    },
    searchSectionLabel: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      fontWeight: fontWeight.semibold,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: spacing.sm,
    },
    // User rows in modal
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm + 2,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.surfaceBorder,
      gap: spacing.sm,
    },
    userRowSelected: {
      backgroundColor: colors.primary + '08',
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.bold,
      color: colors.text,
    },
    userInfo: { flex: 1 },
    userName: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: colors.text,
    },
    userMeta: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      marginTop: 1,
    },
    checkCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.surfaceBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkCircleActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkMark: {
      fontSize: 12,
      color: colors.background,
      fontWeight: fontWeight.bold,
    },
    // Selected chips row
    chipsScroll: {
      marginBottom: spacing.sm,
    },
    chipsContainer: {
      flexDirection: 'row',
      gap: spacing.xs,
      paddingHorizontal: 2,
      paddingVertical: spacing.xs,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '18',
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.primary + '50',
      paddingVertical: 5,
      paddingLeft: 5,
      paddingRight: spacing.sm,
      gap: spacing.xs,
      maxWidth: 130,
    },
    chipAvatar: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    chipAvatarText: {
      fontSize: 11,
      fontWeight: fontWeight.bold,
      color: colors.background,
    },
    chipName: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      color: colors.primary,
      flex: 1,
    },
    chipRemove: {
      fontSize: fontSize.md,
      color: colors.primary,
      fontWeight: fontWeight.bold,
      lineHeight: fontSize.md,
    },
  });
