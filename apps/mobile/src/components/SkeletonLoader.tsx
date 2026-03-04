import { Animated, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useEffect, useRef } from 'react';
import { useTheme } from '../theme';
import { borderRadius, spacing } from '../constants/theme';

interface SkeletonLoaderProps {
  width: number | `${number}%` | 'auto';
  height: number;
  borderRadiusValue?: number;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonLoader({
  width,
  height,
  borderRadiusValue = 8,
  style,
}: SkeletonLoaderProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  const { colors } = useTheme();

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: borderRadiusValue,
          backgroundColor: colors.surfaceBorder,
          opacity,
        },
        style,
      ]}
    />
  );
}

/** Convenience: session-card-shaped skeleton */
export function SkeletonCard({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.surfaceBorder,
        },
        style,
      ]}
    >
      {/* title row */}
      <View style={styles.row}>
        <SkeletonLoader width="55%" height={14} borderRadiusValue={7} />
        <SkeletonLoader width={60} height={22} borderRadiusValue={6} />
      </View>
      {/* amount row */}
      <SkeletonLoader width="35%" height={20} borderRadiusValue={7} style={{ marginTop: spacing.sm }} />
      {/* meta row */}
      <SkeletonLoader width="50%" height={12} borderRadiusValue={6} style={{ marginTop: spacing.xs }} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
