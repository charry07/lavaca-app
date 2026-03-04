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
import { GlassCard } from '../src/components';
import { useI18n } from '../src/i18n';
import { useTheme } from '../src/theme';
import { useAuth } from '../src/auth';
import { useToast } from '../src/components/Toast';

export default function CreateScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { showError } = useToast();
  const s = createStyles(colors);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [currency, setCurrency] = useState<'COP' | 'USD' | 'EUR'>('COP');
  const [loading, setLoading] = useState(false);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [participantSearchQuery, setParticipantSearchQuery] = useState('');
  const [participantResults, setParticipantResults] = useState<User[]>([]);
  const [frequentParticipants, setFrequentParticipants] = useState<User[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<User[]>([]);
  const [loadingFrequent, setLoadingFrequent] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const CURRENCIES: { key: 'COP' | 'USD' | 'EUR'; symbol: string }[] = [
    { key: 'COP', symbol: '🇨🇴 COP' },
    { key: 'USD', symbol: '🇺🇸 USD' },
    { key: 'EUR', symbol: '🇪🇺 EUR' },
  ];

  const SPLIT_MODES: { key: SplitMode; label: string; emoji: string }[] = [
    { key: 'equal', label: t('create.equalParts'), emoji: '⚖️' },
    { key: 'percentage', label: t('create.percentage'), emoji: '📊' },
    { key: 'roulette', label: t('create.roulette'), emoji: '🎰' },
  ];

  const handleCreate = async () => {
    const numAmount = Number(amount.replace(/[^0-9]/g, ''));
    if (!numAmount || numAmount <= 0) {
      showError(t('create.invalidAmount'));
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
    } catch (err: any) {
      showError(err.message || t('create.errorCreating'));
    } finally {
      setLoading(false);
    }
  };

  const openAddParticipantModal = async () => {
    setShowAddParticipantModal(true);
    setParticipantSearchQuery('');
    setParticipantResults([]);

    if (!user?.id) { setFrequentParticipants([]); return; }

    setLoadingFrequent(true);
    try {
      const frequent = await api.getFrequentUsers(user.id, 7);
      setFrequentParticipants(frequent.slice(0, 7));
    } catch {
      setFrequentParticipants([]);
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

  const displayedParticipants =
    participantSearchQuery.trim().length >= 2 ? participantResults : frequentParticipants.slice(0, 7);

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
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        <Text style={s.sectionTitle}>{t('create.totalAmount')}</Text>
        <GlassCard style={s.amountCard}>
          <TextInput
            style={s.amountInput}
            placeholder="$0"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            autoFocus
          />
        </GlassCard>

        <Text style={s.sectionTitle}>{t('create.description')}</Text>
        <TextInput
          style={s.input}
          placeholder={t('create.descriptionPlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
        />

        <Text style={s.sectionTitle}>{t('create.currency')}</Text>
        <View style={s.pillRow}>
          {CURRENCIES.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={{ flex: 1, borderRadius: borderRadius.md, overflow: 'hidden' }}
              onPress={() => setCurrency(c.key)}
            >
              {currency === c.key ? (
                <LinearGradient
                  colors={[colors.accent || colors.primary, colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.pillActive}
                >
                  <Text style={s.pillTextActive}>{c.symbol}</Text>
                </LinearGradient>
              ) : (
                <View style={s.pill}>
                  <Text style={s.pillText}>{c.symbol}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionTitle}>{t('create.howToSplit')}</Text>
        <View style={s.pillRow}>
          {SPLIT_MODES.map((mode) => (
            <TouchableOpacity
              key={mode.key}
              style={{ flex: 1, borderRadius: borderRadius.md, overflow: 'hidden' }}
              onPress={() => setSplitMode(mode.key)}
            >
              {splitMode === mode.key ? (
                <LinearGradient
                  colors={[colors.primary, colors.accent || colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.modeButtonActive}
                >
                  <Text style={s.modeEmoji}>{mode.emoji}</Text>
                  <Text style={s.modeLabelActive}>{mode.label}</Text>
                </LinearGradient>
              ) : (
                <View style={s.modeButton}>
                  <Text style={s.modeEmoji}>{mode.emoji}</Text>
                  <Text style={s.modeLabel}>{mode.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={s.addParticipantButton} onPress={openAddParticipantModal}>
          <Text style={s.addParticipantButtonText}>➕ {t('session.addParticipants')}</Text>
        </TouchableOpacity>

        {selectedParticipants.length > 0 && (
          <Text style={s.selectedCountText}>
            {t('create.selectedParticipants', { count: selectedParticipants.length })}
          </Text>
        )}

        <TouchableOpacity
          style={{ borderRadius: borderRadius.md, overflow: 'hidden', marginTop: spacing.xl, opacity: loading ? 0.6 : 1 }}
          onPress={handleCreate}
          disabled={loading}
        >
          <LinearGradient
            colors={[colors.primary, colors.accent || colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.createButton}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.createButtonText}>{t('create.createButton')}</Text>
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
        <View style={[s.modalOverlay, { backgroundColor: colors.overlay }]}>
          <GlassCard style={s.modalContent}>
            <View style={s.searchModalInner}>
              <View style={s.searchModalHeader}>
                <Text style={s.modalTitle}>{t('session.addParticipants')}</Text>
                <TouchableOpacity onPress={() => setShowAddParticipantModal(false)}>
                  <Text style={s.searchModalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={s.searchInput}
                placeholder={t('session.searchPeoplePlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={participantSearchQuery}
                onChangeText={setParticipantSearchQuery}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
              />

              {(loadingFrequent && participantSearchQuery.trim().length < 2) && (
                <ActivityIndicator size="small" color={colors.primary} style={s.searchLoading} />
              )}
              {(searchingUsers && participantSearchQuery.trim().length >= 2) && (
                <ActivityIndicator size="small" color={colors.primary} style={s.searchLoading} />
              )}
              {!searchingUsers && !loadingFrequent && displayedParticipants.length === 0 && (
                <Text style={s.searchHintText}>
                  {participantSearchQuery.trim().length >= 2
                    ? t('session.noUserResults')
                    : t('create.noFrequentPeople')}
                </Text>
              )}
              {!searchingUsers && !loadingFrequent && participantSearchQuery.trim().length < 2 && displayedParticipants.length > 0 && (
                <Text style={s.searchHintText}>{t('create.frequentPeopleHint')}</Text>
              )}

              <FlatList
                data={displayedParticipants}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item: foundUser }) => {
                  const isSelected = selectedIds.has(foundUser.id);
                  return (
                    <View style={s.searchResultCard}>
                      <View style={s.avatarBadge}>
                        <Text style={s.avatarBadgeText}>
                          {foundUser.displayName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={s.searchUserInfo}>
                        <Text style={s.searchUserName}>{foundUser.displayName}</Text>
                        <Text style={s.searchUserMeta}>@{foundUser.username} · {foundUser.phone}</Text>
                      </View>
                      <TouchableOpacity
                        style={[s.addUserButton, isSelected && s.addUserButtonSelected]}
                        onPress={() => toggleParticipant(foundUser)}
                      >
                        <Text style={[s.addUserButtonText, isSelected && s.addUserButtonTextSelected]}>
                          {isSelected ? t('create.added') : t('groups.addButton')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                }}
              />
            </View>
          </GlassCard>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
    sectionTitle: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
      marginTop: spacing.lg,
    },
    amountCard: {
      padding: 0,
      borderRadius: borderRadius.md,
      overflow: 'hidden',
    },
    amountInput: {
      fontSize: fontSize.xxl,
      fontWeight: fontWeight.bold,
      color: colors.text,
      padding: spacing.lg,
      textAlign: 'center',
    },
    input: {
      fontSize: fontSize.md,
      color: colors.text,
      backgroundColor: colors.glass,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    pillRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    pill: {
      flex: 1,
      backgroundColor: colors.glass,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    pillActive: {
      flex: 1,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      borderRadius: borderRadius.md,
    },
    pillText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.semibold },
    pillTextActive: { fontSize: fontSize.sm, color: '#fff', fontWeight: fontWeight.bold },
    modeButton: {
      flex: 1,
      backgroundColor: colors.glass,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    modeButtonActive: {
      flex: 1,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      alignItems: 'center',
    },
    modeEmoji: { fontSize: 28, marginBottom: spacing.xs },
    modeLabel: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center' },
    modeLabelActive: { fontSize: fontSize.sm, color: '#fff', textAlign: 'center', fontWeight: fontWeight.semibold },
    addParticipantButton: {
      marginTop: spacing.lg,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      backgroundColor: colors.glass,
    },
    addParticipantButtonText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.bold,
      color: colors.primary,
    },
    selectedCountText: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    createButton: {
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
    },
    createButtonText: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: '#fff',
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      borderRadius: borderRadius.lg,
      maxWidth: 360,
      width: '90%',
      overflow: 'hidden',
      maxHeight: '80%',
    },
    searchModalInner: { padding: spacing.lg },
    searchModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    modalTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
    searchModalClose: { fontSize: 22, color: colors.textMuted, paddingHorizontal: spacing.xs },
    searchInput: {
      backgroundColor: colors.glass,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: fontSize.md,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      marginBottom: spacing.sm,
    },
    searchLoading: { marginVertical: spacing.md },
    searchHintText: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
      textAlign: 'center',
      paddingVertical: spacing.md,
    },
    searchResultCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.glassBorder,
    },
    avatarBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary + '33',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    avatarBadgeText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary },
    searchUserInfo: { flex: 1 },
    searchUserName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
    searchUserMeta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
    addUserButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: borderRadius.sm,
      minWidth: 86,
      alignItems: 'center',
    },
    addUserButtonSelected: {
      backgroundColor: colors.glass,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    addUserButtonText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: '#fff' },
    addUserButtonTextSelected: { color: colors.primary },
  });
