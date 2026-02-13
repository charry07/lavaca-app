import { View, Text, StyleSheet } from 'react-native';
import { spacing, borderRadius, type ThemeColors } from '../constants/theme';
import { useTheme } from '../theme';

interface VacaLogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: { cow: 36, money: 18, badge: 24, name: 20, offset: -8 },
  md: { cow: 64, money: 28, badge: 36, name: 36, offset: -14 },
  lg: { cow: 90, money: 40, badge: 50, name: 48, offset: -20 },
};

export function VacaLogo({ size = 'lg' }: VacaLogoProps) {
  const sz = sizes[size];
  const { colors } = useTheme();
  const s = createStyles(colors);

  return (
    <View style={s.container}>
      {/* Cow + money badge */}
      <View style={s.iconWrap}>
        <Text style={{ fontSize: sz.cow }}>🐄</Text>
        <View
          style={[
            s.badge,
            {
              width: sz.badge,
              height: sz.badge,
              borderRadius: sz.badge / 2,
              right: sz.offset,
              bottom: sz.offset,
            },
          ]}
        >
          <Text style={{ fontSize: sz.money, lineHeight: sz.money + 4 }}>💸</Text>
        </View>
      </View>

      {/* App name */}
      <Text style={[s.name, { fontSize: sz.name }]}>La Vaca</Text>

      {/* Floating bills decoration */}
      {size === 'lg' && (
        <View style={s.decoration}>
          <Text style={s.decoLeft}>💵</Text>
          <Text style={s.decoRight}>💰</Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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