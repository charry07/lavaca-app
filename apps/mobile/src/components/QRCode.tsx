import { View, Image, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';

interface QRCodeProps {
  value: string;
  size?: number;
  label?: string;
}

export function QRCode({ value, size = 200, label }: QRCodeProps) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=1a1a2e&color=4ade80&format=png`;

  return (
    <View style={styles.container}>
      <View style={styles.qrWrapper}>
        <Image
          source={{ uri: qrUrl }}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </View>
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  qrWrapper: {
    backgroundColor: '#1a1a2e',
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