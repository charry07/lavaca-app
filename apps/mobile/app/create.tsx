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
import { useRouter } from 'expo-router';
import { SplitMode, User } from '@lavaca/shared';
import { api } from '../src/services/api';
import { spacing, borderRadius, fontSize, type ThemeColors } from '../src/constants/theme';
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

    if (!user?.id) {
      setFrequentParticipants([]);
      return;
    }

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

  const closeAddParticipantModal = () => {
    setShowAddParticipantModal(false);
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
    () => new Map(frequentParticipants.map((p, index) => [p.id, index])),
    [frequentParticipants]
  );

  const displayedParticipants =
    participantSearchQuery.trim().length >= 2
      ? participantResults
      : frequentParticipants.slice(0, 7);

  useEffect(() => {
    if (!showAddParticipantModal) return;

    const query = participantSearchQuery.trim();
    if (query.length < 2) {
      setParticipantResults([]);
      setSearchingUsers(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const results = await api.searchUsers(query);
        const filtered = results.filter((result) => result.id !== user?.id);
        const sorted = [...filtered].sort((a, b) => {
          const rankA = frequentRank.has(a.id) ? (frequentRank.get(a.id) as number) : Number.MAX_SAFE_INTEGER;
          const rankB = frequentRank.has(b.id) ? (frequentRank.get(b.id) as number) : Number.MAX_SAFE_INTEGER;
          if (rankA !== rankB) return rankA - rankB;
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
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.sectionTitle}>{t('create.totalAmount')}</Text>
        <TextInput
          style={s.amountInput}
          placeholder="$0"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          autoFocus
        />

        <Text style={s.sectionTitle}>{t('create.description')}</Text>
        <TextInput
          style={s.input}
          placeholder={t('create.descriptionPlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
        />

        <Text style={s.sectionTitle}>{t('create.currency')}</Text>
        <View style={s.currencyContainer}>
          {CURRENCIES.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={[s.currencyButton, currency === c.key && s.currencyButtonActive]}
              onPress={() => setCurrency(c.key)}
            >
              <Text style={[s.currencyLabel, currency === c.key && s.currencyLabelActive]}>
                {c.symbol}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionTitle}>{t('create.howToSplit')}</Text>
        <View style={s.modeContainer}>
          {SPLIT_MODES.map((mode) => (
            <TouchableOpacity
              key={mode.key}
              style={[
                s.modeButton,
                splitMode === mode.key && s.modeButtonActive,
              ]}
              onPress={() => setSplitMode(mode.key)}
            >
              <Text style={s.modeEmoji}>{mode.emoji}</Text>
              <Text
                style={[
                  s.modeLabel,
                  splitMode === mode.key && s.modeLabelActive,
                ]}
              >
                {mode.label}
              </Text>
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
          style={[s.createButton, loading && s.createButtonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={s.createButtonText}>{t('create.createButton')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showAddParticipantModal}
        animationType="slide"
        transparent
        onRequestClose={closeAddParticipantModal}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.searchModalInner}>
              <View style={s.searchModalHeader}>
                <Text style={s.modalTitle}>{t('session.addParticipants')}</Text>
                <TouchableOpacity onPress={closeAddParticipantModal}>
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

              {loadingFrequent && participantSearchQuery.trim().length < 2 && (
                <ActivityIndicator size="small" color={colors.primary} style={s.searchLoading} />
              )}

              {searchingUsers && participantSearchQuery.trim().length >= 2 && (
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
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    sectionTitle: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.sm,
      marginTop: spacing.lg,
    },
    amountInput: {
      fontSize: fontSize.xxl,
      fontWeight: 'bold',
      color: colors.text,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      textAlign: 'center',
    },
    input: {
      fontSize: fontSize.md,
      color: colors.text,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    modeContainer: {
      flexDirection: 'row',
    },
    modeButton: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginHorizontal: spacing.xs,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.surfaceBorder,
    },
    modeButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.background,
    },
    modeEmoji: {
      fontSize: 28,
      marginBottom: spacing.xs,
    },
    modeLabel: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    modeLabelActive: {
      color: colors.primary,
      fontWeight: '600',
    },
    currencyContainer: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    currencyButton: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.surfaceBorder,
    },
    currencyButtonActive: {
      borderColor: colors.accent,
      backgroundColor: colors.background,
    },
    currencyLabel: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    currencyLabelActive: {
      color: colors.accent,
    },
    createButton: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      marginTop: spacing.xl,
    },
    addParticipantButton: {
      marginTop: spacing.lg,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    addParticipantButtonText: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: colors.primary,
    },
    selectedCountText: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    createButtonDisabled: {
      opacity: 0.6,
    },
    createButtonText: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: colors.background,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: borderRadius.lg,
      maxWidth: 360,
      width: '90%',
      overflow: 'hidden',
      maxHeight: '80%',
    },
    searchModalInner: {
      padding: spacing.lg,
    },
    searchModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    modalTitle: {
      fontSize: fontSize.xl,
      fontWeight: 'bold',
      color: colors.text,
    },
    searchModalClose: {
      fontSize: 22,
      color: colors.textMuted,
      paddingHorizontal: spacing.xs,
    },
    searchInput: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: fontSize.md,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      marginBottom: spacing.sm,
    },
    searchLoading: {
      marginVertical: spacing.md,
    },
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
      borderBottomColor: colors.surfaceBorder,
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
    avatarBadgeText: {
      fontSize: fontSize.md,
      fontWeight: '700',
      color: colors.primary,
    },
    searchUserInfo: {
      flex: 1,
    },
    searchUserName: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.text,
    },
    searchUserMeta: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      marginTop: 2,
    },
    addUserButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: borderRadius.sm,
      minWidth: 86,
      alignItems: 'center',
    },
    addUserButtonSelected: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    addUserButtonText: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: colors.background,
    },
    addUserButtonTextSelected: {
      color: colors.primary,
    },
  });
