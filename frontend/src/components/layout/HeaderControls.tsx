import {useState} from "react";
import {View, TouchableOpacity, Text, StyleSheet, Modal, ScrollView} from "react-native";
import {Feather} from "@expo/vector-icons";
import {useI18n, LOCALE_FLAGS, LOCALE_LABELS, type Locale} from "../../i18n";
import {useTheme} from "../../theme";
import {borderRadius, spacing, fontSize, fontWeight} from "../../constants/theme";

const LOCALES: Locale[] = ["es", "en", "pt", "de"];

export function HeaderControls() {
  const {locale, setLocale} = useI18n();
  const {colors, toggleTheme, isDark} = useTheme();
  const [showLanguageList, setShowLanguageList] = useState(false);

  const styles = createStyles(colors);

  const handleSelectLanguage = (next: Locale) => {
    setLocale(next);
    setShowLanguageList(false);
  };

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.languageButton}
          onPress={() => setShowLanguageList(true)}
          activeOpacity={0.85}
          accessibilityRole='button'
          accessibilityLabel={`Language: ${LOCALE_LABELS[locale]}`}
          accessibilityHint='Opens language list'
          accessibilityState={{ expanded: showLanguageList }}>
          <Text style={styles.flag}>{LOCALE_FLAGS[locale]}</Text>
          <Text style={styles.languageLabel} numberOfLines={1}>
            {LOCALE_LABELS[locale]}
          </Text>
          <Feather name={showLanguageList ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.separator} />

        <TouchableOpacity style={styles.themeButton} onPress={toggleTheme} activeOpacity={0.85} accessibilityRole='button' accessibilityLabel={isDark ? "Enable light theme" : "Enable dark theme"}>
          <Feather name={isDark ? "sun" : "moon"} size={17} color={colors.text} />
        </TouchableOpacity>
      </View>

      <Modal visible={showLanguageList} transparent animationType='fade' onRequestClose={() => setShowLanguageList(false)}>
        <TouchableOpacity activeOpacity={1} style={styles.modalOverlay} onPress={() => setShowLanguageList(false)}>
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => setShowLanguageList(false)} accessibilityRole='button' accessibilityLabel='Close language list'>
                <Feather name='x' size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.list}>
              {LOCALES.map((loc) => {
                const isSelected = loc === locale;
                return (
                  <TouchableOpacity
                    key={loc}
                    style={[styles.languageRow, isSelected && styles.languageRowSelected]}
                    onPress={() => handleSelectLanguage(loc)}
                    accessibilityRole='button'
                    accessibilityLabel={`Language ${LOCALE_LABELS[loc]}`}>
                    <View style={styles.languageRowLeft}>
                      <Text style={styles.optionFlag}>{LOCALE_FLAGS[loc]}</Text>
                      <Text style={styles.optionLabel}>{LOCALE_LABELS[loc]}</Text>
                    </View>
                    {isSelected ? <Feather name='check' size={16} color={colors.primary} /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    languageButton: {
      minHeight: 44,
      minWidth: 44,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    flag: {
      fontSize: 17,
    },
    languageLabel: {
      maxWidth: 96,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: colors.text,
    },
    separator: {
      width: 1,
      height: 22,
      backgroundColor: colors.surfaceBorder,
    },
    themeButton: {
      minHeight: 44,
      minWidth: 44,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.glassBorder,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.sm,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.lg,
    },
    modalCard: {
      width: "100%",
      maxWidth: 320,
      maxHeight: "70%",
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      backgroundColor: colors.surface2,
      overflow: "hidden",
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceBorder,
    },
    modalTitle: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: colors.text,
    },
    modalClose: {
      minWidth: 44,
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    list: {
      paddingVertical: spacing.xs,
    },
    languageRow: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    languageRowSelected: {
      backgroundColor: colors.primarySoft,
    },
    languageRowLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    optionFlag: {
      fontSize: 19,
    },
    optionLabel: {
      fontSize: fontSize.md,
      color: colors.text,
      fontWeight: fontWeight.medium,
    },
  });
