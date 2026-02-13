import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useI18n, LOCALE_FLAGS, type Locale } from '../i18n';
import { colors, spacing, borderRadius } from '../constants/theme';

const LOCALES: Locale[] = ['es', 'en', 'pt'];

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <View style={styles.container}>
      {LOCALES.map((loc) => (
        <TouchableOpacity
          key={loc}
          style={[styles.flag, locale === loc && styles.flagActive]}
          onPress={() => setLocale(loc)}
        >
          <Text style={styles.flagText}>{LOCALE_FLAGS[loc]}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  flag: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginHorizontal: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  flagActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  flagText: {
    fontSize: 24,
  },
});
