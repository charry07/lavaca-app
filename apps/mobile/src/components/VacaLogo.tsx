import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../constants/theme';

interface VacaLogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: { cow: 36, money: 18, badge: 24, name: 20, offset: -8 },
  md: { cow: 64, money: 28, badge: 36, name: 36, offset: -14 },
  lg: { cow: 90, money: 40, badge: 50, name: 48, offset: -20 },
};

export function VacaLogo({ size = 'lg' }: VacaLogoProps) {
  const s = sizes[size];

  return (
    <View style={styles.container}>
      {/* Cow + money badge */}
      <View style={styles.iconWrap}>
        <Text style={{ fontSize: s.cow }}>🐄</Text>
        <View
          style={[
            styles.badge,
            {
              width: s.badge,
              height: s.badge,
              borderRadius: s.badge / 2,
              right: s.offset,
              bottom: s.offset,
            },
          ]}
        >
          <Text style={{ fontSize: s.money, lineHeight: s.money + 4 }}>💸</Text>
        </View>
      </View>

      {/* App name */}
      <Text style={[styles.name, { fontSize: s.name }]}>La Vaca</Text>

      {/* Floating bills decoration */}
      {size === 'lg' && (
        <View style={styles.decoration}>
          <Text style={styles.decoLeft}>💵</Text>
          <Text style={styles.decoRight}>💰</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  iconWrap: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  badge: {
    position: 'absolute',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 1,
  },
  decoration: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    position: 'absolute',
    top: 10,
  },
  decoLeft: {
    fontSize: 22,
    marginRight: 100,
    opacity: 0.5,
    transform: [{ rotate: '-15deg' }],
  },
  decoRight: {
    fontSize: 22,
    marginLeft: 100,
    opacity: 0.5,
    transform: [{ rotate: '15deg' }],
  },
});