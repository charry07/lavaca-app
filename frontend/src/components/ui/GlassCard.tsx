import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../theme';
import { borderRadius as br } from '../../constants/theme';

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
  const radius = br[borderRadiusKey];
  const blurIntensity = intensity ?? (isDark ? 18 : 35);

  // On web, BlurView is not supported — use a warm surface View instead
  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          styles.base,
          {
            borderRadius: radius,
            backgroundColor: colors.glass,
            borderColor: colors.glassBorder,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <BlurView
      intensity={blurIntensity}
      tint={isDark ? 'dark' : 'light'}
      style={[
        styles.base,
        {
          borderRadius: radius,
          backgroundColor: colors.glass,
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
    boxShadow: '0px 8px 22px rgba(0,0,0,0.22)',
    elevation: 9,
  },
});
