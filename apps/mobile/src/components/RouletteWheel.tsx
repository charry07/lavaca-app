import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Participant } from '@lavaca/shared';
import { spacing, borderRadius, fontSize, type ThemeColors } from '../constants/theme';
import { useI18n } from '../i18n';
import { useTheme } from '../theme';

interface RouletteWheelProps {
  participants: Participant[];
  winnerIndex: number;
  onFinish: () => void;
}

const TOTAL_SPINS = 6;
const WHEEL_SIZE = 280;
const LABEL_RADIUS = 110;

export function RouletteWheel({ participants, winnerIndex, onFinish }: RouletteWheelProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [winnerPulse, setWinnerPulse] = useState(false);
  const rotation = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { t } = useI18n();
  const { colors } = useTheme();
  const s = createStyles(colors);

  const count = participants.length;
  const segmentAngle = count > 0 ? 360 / count : 360;

  useEffect(() => {
    if (count === 0 || winnerIndex < 0 || winnerIndex >= count) {
      return;
    }

    rotation.setValue(0);
    setFinished(false);
    setWinnerPulse(false);

    const finalOffset = (360 - winnerIndex * segmentAngle) % 360;
    const finalRotation = TOTAL_SPINS * 360 + finalOffset;

    const listenerId = rotation.addListener(({ value }) => {
      const normalized = ((value % 360) + 360) % 360;
      const index = Math.round(((360 - normalized) % 360) / segmentAngle) % count;
      setCurrentIndex(index);
    });

    Animated.timing(rotation, {
      toValue: finalRotation,
      duration: 5600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished: animationFinished }) => {
      if (!animationFinished) return;

      setCurrentIndex(winnerIndex);
      setFinished(true);

      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();

      setWinnerPulse(true);
      onFinish();
    });

    return () => {
      rotation.removeListener(listenerId);
      rotation.stopAnimation();
    };
  }, [count, winnerIndex, segmentAngle, rotation, scaleAnim, onFinish]);

  const wheelRotation = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend',
  });

  const participant = participants[currentIndex];
  const winner = winnerIndex >= 0 ? participants[winnerIndex] : null;

  return (
    <View style={s.container}>
      <Text style={s.title}>{t('roulette.title')}</Text>
      <Text style={s.subtitle}>
        {finished ? t('roulette.result') : t('roulette.spinning')}
      </Text>

      <View style={s.wheelContainer}>
        <View style={s.pointer} />

        <Animated.View
          style={[
            s.wheel,
            {
              transform: [{ rotate: wheelRotation }],
            },
          ]}
        >
          {participants.map((p, i) => {
            const angle = i * segmentAngle;
            return (
              <View
                key={p.userId}
                style={[
                  s.segmentLabelWrap,
                  {
                    transform: [
                      { rotate: `${angle}deg` },
                      { translateY: -LABEL_RADIUS },
                      { rotate: `${-angle}deg` },
                    ],
                  },
                ]}
              >
                <Text numberOfLines={1} style={s.segmentLabel}>
                  {p.displayName}
                </Text>
              </View>
            );
          })}

          <View style={s.wheelHub}>
            <Text style={s.hubText}>🎰</Text>
          </View>
        </Animated.View>
      </View>

      <Animated.View
        style={[
          s.nameCard,
          finished && s.nameCardWinner,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={[s.nameText, finished && s.nameTextWinner]}>
          {participant?.displayName ?? '...'}
        </Text>
      </Animated.View>

      <View style={s.dotsRow}>
        {participants.map((p, i) => (
          <View
            key={p.userId}
            style={[
              s.dot,
              i === currentIndex && s.dotActive,
              finished && i === winnerIndex && s.dotWinner,
            ]}
          />
        ))}
      </View>

      {finished && winner && (
        <View style={[s.winnerBanner, winnerPulse && s.winnerBannerPulse]}>
          <Text style={s.winnerEmoji}>🐄💸</Text>
          <Text style={s.winnerText}>
            {t('roulette.winner', { name: winner.displayName })}
          </Text>
          <Text style={s.winnerSubtext}>
            {t('roulette.betterLuck')}
          </Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
  wheelContainer: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    marginBottom: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentLabelWrap: {
    position: 'absolute',
    top: WHEEL_SIZE / 2,
    left: WHEEL_SIZE / 2 - 45,
    width: 90,
    alignItems: 'center',
  },
  segmentLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
    backgroundColor: colors.background,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  pointer: {
    position: 'absolute',
    top: -4,
    width: 0,
    height: 0,
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.warning,
    zIndex: 3,
  },
  wheelHub: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  hubText: {
    fontSize: 28,
  },
  nameCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    minWidth: 240,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  nameCardWinner: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  nameText: {
    fontSize: fontSize.xl,
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
    width: '100%',
  },
  winnerBannerPulse: {
    transform: [{ scale: 1.02 }],
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