import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { fontSize, fontWeight, type ThemeColors } from '../constants/theme';

interface AvatarProps {
  displayName: string;
  avatarUrl?: string | null;
  size?: number;
  showRing?: boolean;
}

export function Avatar({ displayName, avatarUrl, size = 40, showRing = false }: AvatarProps) {
  const { colors } = useTheme();
  const s = createStyles(colors, size, showRing);
  const initial = displayName.charAt(0).toUpperCase();
  return (
    <View style={s.ring}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={s.image} />
      ) : (
        <View style={s.fallback}>
          <Text style={s.initial}>{initial}</Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors, size: number, showRing: boolean) =>
  StyleSheet.create({
    ring: {
      width: size + (showRing ? 4 : 0),
      height: size + (showRing ? 4 : 0),
      borderRadius: (size + (showRing ? 4 : 0)) / 2,
      borderWidth: showRing ? 2 : 0,
      borderColor: showRing ? colors.accent : 'transparent',
      padding: showRing ? 2 : 0,
      backgroundColor: 'transparent',
    },
    image: { width: size, height: size, borderRadius: size / 2 },
    fallback: {
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: colors.surface2, borderWidth: 1,
      borderColor: colors.surfaceBorder, justifyContent: 'center', alignItems: 'center',
    },
    initial: { fontSize: size * 0.38, fontWeight: fontWeight.bold, color: colors.text },
  });
