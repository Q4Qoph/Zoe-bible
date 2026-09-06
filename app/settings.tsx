import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppColors } from "../constants/theme";
import {
  AVAILABLE_TRANSLATIONS,
  TranslationId,
} from "../src/data/translations";
import { useTheme } from "../src/contexts/ThemeContext";
import { useUserDatabase } from "../src/db/UserDatabaseContext";
import {
  generateJsonBackup,
  generateMarkdownExport,
} from "../src/utils/backup";

export default function SettingsScreen() {
  const router = useRouter();
  const userDb = useUserDatabase();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = makeStyles(colors);

  const [fontSize, setFontSize] = useState(18);
  const [showVerseNumbers, setShowVerseNumbers] = useState(true);
  const [activeTranslation, setActiveTranslation] = useState<TranslationId>("BSB");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem("reader_font_size"),
      AsyncStorage.getItem("show_verse_numbers"),
      AsyncStorage.getItem("active_translation"),
    ]).then(([fs, svn, trans]) => {
      if (fs) setFontSize(parseInt(fs));
      if (svn !== null) setShowVerseNumbers(svn !== "false");
      if (trans === "KJV" || trans === "WEB" || trans === "BSB") {
        setActiveTranslation(trans);
      }
    });
  }, []);

  const updateFontSize = (next: number) => {
    setFontSize(next);
    AsyncStorage.setItem("reader_font_size", next.toString());
  };

  const toggleVerseNumbers = (val: boolean) => {
    setShowVerseNumbers(val);
    AsyncStorage.setItem("show_verse_numbers", val ? "true" : "false");
  };

  const handleSelectTranslation = async (id: TranslationId) => {
    setActiveTranslation(id);
    await AsyncStorage.setItem("active_translation", id);
    Alert.alert(
      "Translation Changed",
      `Active Bible translation set to ${id} (${id === "BSB" ? "Berean Standard Bible" : id === "KJV" ? "King James Version" : "World English Bible"}).`
    );
  };

  const clearSearchHistory = async () => {
    Alert.alert("Clear Search History", "Are you sure you want to clear your recent search terms?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("search_history");
          Alert.alert("Cleared", "Search history has been cleared.");
        },
      },
    ]);
  };

  const handleExportMarkdown = async () => {
    setExporting(true);
    try {
      const md = await generateMarkdownExport(userDb);
      await Share.share({
        message: md,
        title: "Zoe Bible — Study Notebook",
      });
    } catch {
      Alert.alert("Export Failed", "Unable to export markdown notebook.");
    } finally {
      setExporting(false);
    }
  };

  const handleExportJson = async () => {
    setExporting(true);
    try {
      const json = await generateJsonBackup(userDb);
      await Share.share({
        message: json,
        title: "Zoe Bible Backup (JSON)",
      });
    } catch {
      Alert.alert("Export Failed", "Unable to generate JSON backup.");
    } finally {
      setExporting(false);
    }
  };

  const viewOnboarding = async () => {
    await AsyncStorage.removeItem("onboarded");
    router.replace("/onboarding");
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#FF6B35" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Preferred Active Translation */}
        <Text style={styles.sectionLabel}>BIBLE TRANSLATION</Text>
        <View style={styles.card}>
          {AVAILABLE_TRANSLATIONS.map((t, idx) => {
            const isSelected = activeTranslation === t.id;
            return (
              <View key={t.id}>
                <TouchableOpacity
                  style={[styles.translationRow, isSelected && styles.translationRowSelected]}
                  onPress={() => handleSelectTranslation(t.id)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.translationHeader}>
                      <View style={[styles.tagBadge, isSelected && styles.tagBadgeActive]}>
                        <Text style={[styles.tagBadgeText, isSelected && styles.tagBadgeTextActive]}>
                          {t.name}
                        </Text>
                      </View>
                      <Text style={styles.translationFullName}>{t.fullName}</Text>
                    </View>
                    <Text style={styles.translationDesc}>{t.description}</Text>
                    <Text style={styles.translationLicense}>License: {t.license} • {t.year}</Text>
                  </View>
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
                {idx < AVAILABLE_TRANSLATIONS.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}
        </View>

        {/* Reading Preferences */}
        <Text style={styles.sectionLabel}>READING & DISPLAY</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Reader Font Size</Text>
            <View style={styles.fontControls}>
              <TouchableOpacity
                style={styles.fontBtn}
                onPress={() => updateFontSize(Math.max(14, fontSize - 2))}
              >
                <Text style={styles.fontBtnText}>A-</Text>
              </TouchableOpacity>
              <Text style={styles.fontValue}>{fontSize}</Text>
              <TouchableOpacity
                style={styles.fontBtn}
                onPress={() => updateFontSize(Math.min(28, fontSize + 2))}
              >
                <Text style={styles.fontBtnText}>A+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Show Verse Numbers</Text>
            <Switch
              value={showVerseNumbers}
              onValueChange={toggleVerseNumbers}
              trackColor={{ false: colors.border, true: "#7C3AED" }}
              thumbColor={showVerseNumbers ? "#fff" : colors.muted}
            />
          </View>
        </View>

        {/* Appearance */}
        <Text style={styles.sectionLabel}>APPEARANCE</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Theme</Text>
            <View style={styles.themeToggle}>
              <TouchableOpacity
                style={[styles.themeBtn, isDark && styles.themeBtnActive]}
                onPress={() => !isDark && toggleTheme()}
              >
                <Ionicons name="moon" size={14} color={isDark ? "#fff" : colors.muted} />
                <Text style={[styles.themeBtnText, isDark && { color: "#fff" }]}>Dark</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.themeBtn, !isDark && styles.themeBtnActive]}
                onPress={() => isDark && toggleTheme()}
              >
                <Ionicons name="sunny" size={14} color={!isDark ? "#fff" : colors.muted} />
                <Text style={[styles.themeBtnText, !isDark && { color: "#fff" }]}>Light</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Data & Backup */}
        <Text style={styles.sectionLabel}>BACKUP & EXPORT</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleExportMarkdown} disabled={exporting}>
            <View>
              <Text style={styles.rowLabel}>Export Study Notebook</Text>
              <Text style={styles.rowSubLabel}>Formatted Markdown for Obsidian, Notion & Notes</Text>
            </View>
            <Ionicons name="document-text-outline" size={20} color="#06D6A0" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={handleExportJson} disabled={exporting}>
            <View>
              <Text style={styles.rowLabel}>Full Data Backup (JSON)</Text>
              <Text style={styles.rowSubLabel}>Complete backup of notes, bookmarks & sermons</Text>
            </View>
            <Ionicons name="cloud-download-outline" size={20} color="#38BDF8" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={clearSearchHistory}>
            <Text style={styles.rowLabel}>Clear search history</Text>
            <Ionicons name="trash-outline" size={18} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* About */}
        <Text style={styles.sectionLabel}>ABOUT ZOE BIBLE</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={viewOnboarding}>
            <Text style={styles.rowLabel}>View Onboarding Tutorial</Text>
            <Ionicons name="refresh-outline" size={18} color={colors.muted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>1.0.0 (Offline-First Edition)</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 56,
      paddingBottom: 16,
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    backBtn: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: c.background,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    title: { fontFamily: "Syne-Bold", fontSize: 18, color: c.text },
    scroll: { padding: 24, paddingBottom: 60 },

    sectionLabel: {
      fontFamily: "DMSans-Medium",
      fontSize: 11,
      color: c.muted,
      letterSpacing: 1,
      marginBottom: 8,
      marginTop: 20,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    rowLabel: { fontFamily: "DMSans-Medium", fontSize: 15, color: c.text },
    rowSubLabel: { fontFamily: "DMSans-Regular", fontSize: 11, color: c.muted, marginTop: 2 },
    rowValue: { fontFamily: "DMSans-Regular", fontSize: 14, color: c.muted },
    divider: { height: 1, backgroundColor: c.border, marginHorizontal: 16 },

    fontControls: { flexDirection: "row", alignItems: "center", gap: 12 },
    fontBtn: {
      backgroundColor: c.background,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: c.border,
    },
    fontBtnText: { fontFamily: "Syne-Bold", fontSize: 14, color: "#FF6B35" },
    fontValue: { fontFamily: "DMSans-Medium", fontSize: 15, color: c.text, minWidth: 28, textAlign: "center" },

    themeToggle: {
      flexDirection: "row",
      backgroundColor: c.background,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      overflow: "hidden",
    },
    themeBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 7,
    },
    themeBtnActive: { backgroundColor: "#7C3AED" },
    themeBtnText: { fontFamily: "DMSans-Medium", fontSize: 13, color: c.muted },

    translationRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      justifyContent: "space-between",
    },
    translationRowSelected: {
      backgroundColor: "#FF6B350a",
    },
    translationHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
    tagBadge: {
      backgroundColor: c.background,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: c.border,
    },
    tagBadgeActive: {
      backgroundColor: "#FF6B35",
      borderColor: "#FF6B35",
    },
    tagBadgeText: { fontFamily: "Syne-Bold", fontSize: 11, color: c.muted },
    tagBadgeTextActive: { color: "#fff" },
    translationFullName: { fontFamily: "Syne-Bold", fontSize: 14, color: c.text },
    translationDesc: { fontFamily: "DMSans-Regular", fontSize: 12, color: c.muted, lineHeight: 18, marginTop: 4 },
    translationLicense: { fontFamily: "DMSans-Regular", fontSize: 11, color: "#7C3AED", marginTop: 4 },

    radioCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: c.border,
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 12,
    },
    radioCircleSelected: {
      borderColor: "#FF6B35",
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: "#FF6B35",
    },
  });
}
