import { BlurView } from 'expo-blur';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { borderRadius as br } from '../constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  borderRadiusKey?: keyof typeof br;
}

export function GlassCard({
  children,
  style,
  intensity,
  borderRadiusKey = 'lg',
}: GlassCardProps) {
  const { colors, isDark } = useTheme();
  const blurIntensity = intensity ?? (isDark ? 20 : 40);
  const radius = br[borderRadiusKey];

  return (
    <BlurView
      intensity={blurIntensity}
      tint={isDark ? 'dark' : 'light'}
      style={[
        styles.base,
        {
          borderRadius: radius,
          borderColor: colors.glassBorder,
        },
        style,
      ]}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    borderWidth: 1,
  },
});
