import { View, Image, Text, StyleSheet } from 'react-native';
import { spacing, borderRadius, fontSize, type ThemeColors } from '../constants/theme';
import { useTheme } from '../theme';

interface QRCodeProps {
  value: string;
  size?: number;
  label?: string;
}

export function QRCode({ value, size = 200, label }: QRCodeProps) {
  const { colors, isDark } = useTheme();
  const s = createStyles(colors);

  const bgHex = isDark ? '1a1a2e' : 'f8fafc';
  const fgHex = isDark ? '4ade80' : '16a34a';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=${bgHex}&color=${fgHex}&format=png`;

  return (
    <View style={s.container}>
      <View style={[s.qrWrapper, { backgroundColor: colors.background }]}>
        <Image
          source={{ uri: qrUrl }}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </View>
      {label && <Text style={s.label}>{label}</Text>}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
    },
    qrWrapper: {
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    label: {
      marginTop: spacing.sm,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });