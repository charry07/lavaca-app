import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useI18n, LOCALE_FLAGS, type Locale } from '../i18n';
import { useTheme } from '../theme';
import { spacing, borderRadius } from '../constants/theme';

const LOCALES: Locale[] = ['es', 'en', 'pt'];

export function HeaderControls() {
  const { locale, setLocale } = useI18n();
  const { colors, toggleTheme, isDark } = useTheme();

  return (
    <View style={styles.container}>
      {LOCALES.map((loc) => (
        <TouchableOpacity
          key={loc}
          style={[
            styles.flag,
            { borderColor: locale === loc ? colors.primary : 'transparent' },
            locale === loc && { backgroundColor: colors.surface },
          ]}
          onPress={() => setLocale(loc)}
        >
          <Text style={styles.flagText}>{LOCALE_FLAGS[loc]}</Text>
        </TouchableOpacity>
      ))}
      <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />
      <TouchableOpacity
        style={[styles.themeButton, { backgroundColor: colors.surface }]}
        onPress={toggleTheme}
      >
        <Text style={styles.themeIcon}>{isDark ? '☀️' : '🌙'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginHorizontal: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
  },
  flagText: {
    fontSize: 18,
  },
  separator: {
    width: 1,
    height: 20,
    marginHorizontal: 6,
  },
  themeButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: borderRadius.sm,
  },
  themeIcon: {
    fontSize: 18,
  },
});
