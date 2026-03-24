import {useCallback, useEffect, useRef, useState} from "react";
import {View, Text, StyleSheet, Animated, Easing} from "react-native";
import Svg, {Path, Circle, G, Polygon} from "react-native-svg";
import {Participant} from "@lavaca/shared";
import {spacing, borderRadius, fontSize, type ThemeColors} from "../../constants/theme";
import {useI18n} from "../../i18n";
import {useTheme} from "../../theme";

interface RouletteWheelProps {
  participants: Participant[];
  winnerIndex: number;
  onFinish: () => void;
}

const TOTAL_SPINS = 6;
const WHEEL_SIZE = 280;
const RADIUS = WHEEL_SIZE / 2 - 8;
const INNER_RADIUS = 50;
const LABEL_RADIUS = 85;

// Generate distinct colors for each segment - highly vibrant and contrasting
const SEGMENT_COLORS = [
  "#FF2D2D",
  "#00D9FF",
  "#1E90FF",
  "#FF6B1E",
  "#00AA00",
  "#FFD700",
  "#8B008B",
  "#FF1493",
  "#00CED1",
  "#FF8C00",
  "#C41E3A",
  "#00FF7F",
  "#FFB6C1",
  "#4169E1",
  "#FF4500",
  "#00BFFF",
  "#DC143C",
  "#32CD32",
  "#FF69B4",
  "#1E88E5",
];

const getSegmentColor = (index: number) => {
  return SEGMENT_COLORS[index % SEGMENT_COLORS.length];
};

const degreesToRadians = (degrees: number) => (degrees * Math.PI) / 180;

const polarToCartesian = (angle: number, distance: number) => {
  const radians = degreesToRadians(angle - 90);
  return {
    x: distance * Math.cos(radians),
    y: distance * Math.sin(radians),
  };
};

const createArcPath = (startAngle: number, endAngle: number, outerRadius: number, innerRadius: number) => {
  const start = polarToCartesian(endAngle, outerRadius);
  const end = polarToCartesian(startAngle, outerRadius);
  const innerStart = polarToCartesian(endAngle, innerRadius);
  const innerEnd = polarToCartesian(startAngle, innerRadius);

  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return `
    M ${start.x} ${start.y}
    A ${outerRadius} ${outerRadius} 0 ${largeArc} 0 ${end.x} ${end.y}
    L ${innerEnd.x} ${innerEnd.y}
    A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${innerStart.x} ${innerStart.y}
    Z
  `;
};

export function RouletteWheel({participants, winnerIndex, onFinish}: RouletteWheelProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [winnerPulse, setWinnerPulse] = useState(false);
  const rotation = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const hasStarted = useRef(false);
  const onFinishRef = useRef(onFinish);
  const { translate } = useI18n();
  const {colors} = useTheme();
  const s = createStyles(colors);

  const count = participants.length;
  const segmentAngle = count > 0 ? 360 / count : 360;

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const runSpin = useCallback(() => {
    if (count === 0 || winnerIndex < 0 || winnerIndex >= count) return;

    rotation.setValue(0);
    setFinished(false);
    setWinnerPulse(false);

    const slicePadding = Math.min(4, segmentAngle * 0.1);
    const randomWithinSlice = Math.random() * (segmentAngle - slicePadding * 2) + slicePadding;
    const targetAngle = winnerIndex * segmentAngle + randomWithinSlice;
    const finalOffset = (360 - targetAngle) % 360;
    const finalRotation = TOTAL_SPINS * 360 + finalOffset;
    const duration = 10000;

    const listenerId = rotation.addListener(({value}) => {
      const normalized = ((value % 360) + 360) % 360;
      const index = Math.round(((360 - normalized) % 360) / segmentAngle) % count;
      setCurrentIndex(index);
    });

    Animated.timing(rotation, {
      toValue: finalRotation,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({finished: animationFinished}) => {
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
      onFinishRef.current();
    });

    return () => {
      rotation.removeListener(listenerId);
      rotation.stopAnimation();
    };
  }, [count, winnerIndex, segmentAngle, rotation, scaleAnim]);

  useEffect(() => {
    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;
    runSpin();
  }, [runSpin]);

  const wheelRotation = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
    extrapolate: "extend",
  });

  const participant = participants[currentIndex];
  const winner = winnerIndex >= 0 ? participants[winnerIndex] : null;

  return (
    <View style={s.container}>
      <Text style={s.title}>{translate("roulette.title")}</Text>
      <Text style={s.subtitle}>{finished ? translate("roulette.result") : translate("roulette.spinning")}</Text>

      <View style={s.wheelContainer}>
        <View style={s.pointerWrap}>
          <Svg width={34} height={28} viewBox='0 0 34 28'>
            <Polygon points='0,0 34,0 17,28' fill='#FF4444' stroke={colors.text} strokeWidth={2} />
          </Svg>
        </View>

        <Animated.View style={[s.wheelInner, {transform: [{rotate: wheelRotation}]}]}>
          <Svg width={WHEEL_SIZE} height={WHEEL_SIZE} viewBox={`${-WHEEL_SIZE / 2} ${-WHEEL_SIZE / 2} ${WHEEL_SIZE} ${WHEEL_SIZE}`}>
            <G>
              {/* Segments */}
              {participants.map((p, i) => {
                const startAngle = i * segmentAngle;
                const endAngle = (i + 1) * segmentAngle;
                const color = getSegmentColor(i);

                return <Path key={`segment-${p.userId}`} d={createArcPath(startAngle, endAngle, RADIUS, INNER_RADIUS)} fill={color} stroke={colors.background} strokeWidth={2} />;
              })}

              {/* Center circle */}
              <Circle cx={0} cy={0} r={INNER_RADIUS} fill={colors.primary} stroke={colors.background} strokeWidth={2} />
            </G>
          </Svg>

          {/* Center hub text - positioned over SVG */}
          <View style={s.hubWrapper}>
            <Text style={s.hubText}>🎰</Text>
          </View>

          {/* Labels positioned outside segments - rotate with wheel */}
          {participants.map((p, i) => {
            const angle = i * segmentAngle + segmentAngle / 2;
            const radians = degreesToRadians(angle - 90);
            const x = LABEL_RADIUS * Math.cos(radians);
            const y = LABEL_RADIUS * Math.sin(radians);

            return (
              <View
                key={`label-${p.userId}`}
                style={[
                  s.labelContainer,
                  {
                    transform: [{translateX: x}, {translateY: y}],
                  },
                ]}>
                <Text style={s.segmentLabel} numberOfLines={1}>
                  {p.displayName}
                </Text>
              </View>
            );
          })}
        </Animated.View>
      </View>

      <Animated.View
        style={[
          s.nameCard,
          finished && s.nameCardWinner,
          {
            transform: [{scale: scaleAnim}],
          },
        ]}>
        <Text numberOfLines={1} ellipsizeMode='tail' style={[s.nameText, finished && s.nameTextWinner]}>
          {participant?.displayName ?? "..."}
        </Text>
      </Animated.View>

      <View style={s.dotsRow}>
        {participants.map((p, i) => (
          <View key={p.userId} style={[s.dot, i === currentIndex && s.dotActive, finished && i === winnerIndex && s.dotWinner]} />
        ))}
      </View>

      {finished && winner && (
        <View style={[s.winnerBanner, winnerPulse && s.winnerBannerPulse]}>
          <Text style={s.winnerEmoji}>🐄💸</Text>
          <Text style={s.winnerText}>{translate("roulette.winner", {name: winner.displayName})}</Text>
          <Text style={s.winnerSubtext}>{translate("roulette.betterLuck")}</Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: "center",
      padding: spacing.lg,
    },
    title: {
      fontSize: fontSize.xl,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
      marginBottom: spacing.lg,
    },
    wheelContainer: {
      position: "relative",
      width: WHEEL_SIZE,
      height: WHEEL_SIZE,
      marginBottom: spacing.lg,
      justifyContent: "center",
      alignItems: "center",
    },
    wheelInner: {
      width: WHEEL_SIZE,
      height: WHEEL_SIZE,
      justifyContent: "center",
      alignItems: "center",
    },
    pointerWrap: {
      position: "absolute",
      top: -14,
      zIndex: 10,
    },
    hubText: {
      fontSize: 28,
    },
    labelContainer: {
      position: "absolute",
      width: 70,
      alignItems: "center",
      justifyContent: "center",
    },
    segmentLabel: {
      fontSize: fontSize.xs,
      fontWeight: "700",
      color: "#FFFFFF",
      backgroundColor: "rgba(0, 0, 0, 0.85)",
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      textAlign: "center",
      overflow: "hidden",
      maxWidth: 65,
    },
    hubWrapper: {
      position: "absolute",
      width: INNER_RADIUS * 2,
      height: INNER_RADIUS * 2,
      borderRadius: INNER_RADIUS,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 100,
    },
    nameCard: {
      backgroundColor: colors.background,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xxl,
      minWidth: 240,
      alignItems: "center",
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
      fontWeight: "bold",
      color: colors.text,
      maxWidth: 220,
    },
    nameTextWinner: {
      color: colors.background,
    },
    dotsRow: {
      flexDirection: "row",
      justifyContent: "center",
      flexWrap: "wrap",
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
      backgroundColor: "#FF4444",
      transform: [{scale: 1.3}],
    },
    dotWinner: {
      backgroundColor: colors.primary,
      transform: [{scale: 1.5}],
    },
    winnerBanner: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.primary,
      width: "100%",
    },
    winnerBannerPulse: {
      transform: [{scale: 1.02}],
    },
    winnerEmoji: {
      fontSize: 48,
      marginBottom: spacing.sm,
    },
    winnerText: {
      fontSize: fontSize.lg,
      fontWeight: "bold",
      color: colors.primary,
      marginBottom: spacing.xs,
    },
    winnerSubtext: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
    },
  });
