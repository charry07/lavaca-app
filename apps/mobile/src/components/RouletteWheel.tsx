import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Participant } from '@lavaca/shared';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';
import { useI18n } from '../i18n';

interface RouletteWheelProps {
  participants: Participant[];
  winnerIndex: number;
  onFinish: () => void;
}

const TOTAL_SPINS = 4; // Full cycles before landing

export function RouletteWheel({ participants, winnerIndex, onFinish }: RouletteWheelProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const { t } = useI18n();

  useEffect(() => {
    const totalSteps = TOTAL_SPINS * participants.length + winnerIndex;
    let step = 0;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const nextIndex = (step + 1) % participants.length;
      step++;

      // Pulse animation on each name change
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.15,
            duration: 30,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 30,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.5,
            duration: 20,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 30,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      setCurrentIndex(nextIndex);

      if (step >= totalSteps) {
        // Winner landed — big reveal animation
        setTimeout(() => {
          Animated.spring(scaleAnim, {
            toValue: 1.3,
            friction: 3,
            useNativeDriver: true,
          }).start(() => {
            Animated.spring(scaleAnim, {
              toValue: 1,
              friction: 5,
              useNativeDriver: true,
            }).start();
          });
          setFinished(true);
          onFinish();
        }, 200);
        return;
      }

      // Deceleration: starts fast (50ms), ends slow (~500ms)
      const progress = step / totalSteps;
      const delay = 50 + progress * progress * 500;
      timer = setTimeout(tick, delay);
    };

    // Start after a brief pause
    timer = setTimeout(tick, 300);

    return () => clearTimeout(timer);
  }, []);

  const participant = participants[currentIndex];
  const isWinner = finished;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('roulette.title')}</Text>
      <Text style={styles.subtitle}>
        {finished ? t('roulette.result') : t('roulette.spinning')}
      </Text>

      {/* The slot window */}
      <View style={styles.slotContainer}>
        <View style={styles.slotBorder}>
          <Animated.View
            style={[
              styles.nameCard,
              isWinner && styles.nameCardWinner,
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              },
            ]}
          >
            <Text style={[styles.nameText, isWinner && styles.nameTextWinner]}>
              {participant?.displayName ?? '...'}
            </Text>
          </Animated.View>
        </View>
      </View>

      {/* Participant dots — who's in the roulette */}
      <View style={styles.dotsRow}>
        {participants.map((p, i) => (
          <View
            key={p.userId}
            style={[
              styles.dot,
              i === currentIndex && styles.dotActive,
              finished && i === winnerIndex && styles.dotWinner,
            ]}
          />
        ))}
      </View>

      {/* Winner banner */}
      {finished && (
        <View style={styles.winnerBanner}>
          <Text style={styles.winnerEmoji}>🐄💸</Text>
          <Text style={styles.winnerText}>
            {t('roulette.winner', { name: participant?.displayName ?? '' })}
          </Text>
          <Text style={styles.winnerSubtext}>
            {t('roulette.betterLuck')}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  slotContainer: {
    marginBottom: spacing.lg,
  },
  slotBorder: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    backgroundColor: colors.surface,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  nameCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    minWidth: 220,
    alignItems: 'center',
  },
  nameCardWinner: {
    backgroundColor: colors.primary,
  },
  nameText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  nameTextWinner: {
    color: colors.background,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surfaceBorder,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  dotActive: {
    backgroundColor: colors.warning,
    transform: [{ scale: 1.3 }],
  },
  dotWinner: {
    backgroundColor: colors.primary,
    transform: [{ scale: 1.5 }],
  },
  winnerBanner: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  winnerEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  winnerText: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  winnerSubtext: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});