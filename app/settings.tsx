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
import { useTheme } from "../src/contexts/ThemeContext";
import { useUserDatabase } from "../src/db/UserDatabaseContext";
import {
    getBookmarks,
    getHighlights,
    getNotes,
} from "../src/db/userDb";

export default function SettingsScreen() {
  const router = useRouter();
  const userDb = useUserDatabase();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = makeStyles(colors);

  const [fontSize, setFontSize] = useState(18);
  const [showVerseNumbers, setShowVerseNumbers] = useState(true);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem("reader_font_size"),
      AsyncStorage.getItem("show_verse_numbers"),
    ]).then(([fs, svn]) => {
      if (fs) setFontSize(parseInt(fs));
      if (svn !== null) setShowVerseNumbers(svn !== "false");
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

  const clearSearchHistory = async () => {
    await AsyncStorage.removeItem("search_history");
    Alert.alert("Cleared", "Search history has been cleared.");
  };

  const exportData = async () => {
    try {
      const [notes, bookmarks, highlights] = await Promise.all([
        getNotes(userDb),
        getBookmarks(userDb),
        getHighlights(userDb),
      ]);
      const lines = [
        "=== ZOE BIBLE EXPORT ===",
        `Date: ${new Date().toLocaleDateString()}`,
        "",
        `--- NOTES (${notes.length}) ---`,
        ...notes.map(
          (n) => `${n.book_name} ${n.chapter}:${n.verse}\n"${n.verse_text}"\nNote: ${n.note}\n`,
        ),
        `--- BOOKMARKS (${bookmarks.length}) ---`,
        ...bookmarks.map((b) => `${b.book_name} ${b.chapter}:${b.verse} — ${b.text}`),
        "",
        `--- HIGHLIGHTS (${highlights.length}) ---`,
        ...highlights.map((h) => `${h.book_name} ${h.chapter}:${h.verse} [${h.color}] — ${h.text}`),
      ];
      await Share.share({ message: lines.join("\n") });
    } catch {
      Alert.alert("Export failed", "Could not export data.");
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

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Reading */}
        <Text style={styles.sectionLabel}>READING</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Font Size</Text>
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
            <Text style={styles.rowLabel}>Verse Numbers</Text>
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

        {/* Data */}
        <Text style={styles.sectionLabel}>DATA</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={exportData}>
            <Text style={styles.rowLabel}>Export my data</Text>
            <Ionicons name="share-outline" size={18} color={colors.muted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={clearSearchHistory}>
            <Text style={styles.rowLabel}>Clear search history</Text>
            <Ionicons name="trash-outline" size={18} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* About */}
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={viewOnboarding}>
            <Text style={styles.rowLabel}>View Onboarding</Text>
            <Ionicons name="refresh-outline" size={18} color={colors.muted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>1.0.0</Text>
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
  });
}
