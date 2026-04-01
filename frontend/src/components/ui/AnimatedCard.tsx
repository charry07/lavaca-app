import { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { borderRadius, type ThemeColors } from '../../constants/theme';

interface AnimatedCardProps {
  children: React.ReactNode;
  index?: number;
  style?: ViewStyle;
}

export function AnimatedCard({ children, index = 0, style }: AnimatedCardProps) {
  const { colors } = useTheme();
  const s = createStyles(colors);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    const delay = index * 60;
    opacity.value = withDelay(delay, withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) }));
  }, [index, opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[s.card, animStyle, style]}>{children}</Animated.View>;
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface2,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      padding: 16,
      boxShadow: '0px 6px 16px rgba(0,0,0,0.18)',
      elevation: 6,
    },
  });
