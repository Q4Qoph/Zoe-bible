import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppColors } from "../../constants/theme";
import { useTheme } from "../../src/contexts/ThemeContext";
import { useDatabase } from "../../src/db";
import { Book, getBooks } from "../../src/db/queries";
import { AVAILABLE_TRANSLATIONS, TranslationId } from "../../src/data/translations";

const OLD_TESTAMENT_COUNT = 39;

export default function BooksScreen() {
  const db = useDatabase();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [books, setBooks] = useState<Book[]>([]);
  const [tab, setTab] = useState<"OT" | "NT">("OT");
  const [activeTranslation, setActiveTranslation] = useState<TranslationId>("BSB");

  useEffect(() => {
    getBooks(db).then(setBooks);
  }, []);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem("active_translation").then((t) => {
        if (t === "KJV" || t === "WEB" || t === "BSB") {
          setActiveTranslation(t);
        }
      });
    }, [])
  );

  const activeMeta =
    AVAILABLE_TRANSLATIONS.find((t) => t.id === activeTranslation) ||
    AVAILABLE_TRANSLATIONS[0];

  const filtered = books.filter((b) =>
    tab === "OT" ? b.id <= OLD_TESTAMENT_COUNT : b.id > OLD_TESTAMENT_COUNT,
  );

  const styles = makeStyles(colors);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* Top bar with back button — hidden when rendered as tab root */}
      {router.canGoBack() && (
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={20} color="#FF6B35" />
            <Text style={styles.backText}>Home</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
          <View>
            <Text style={styles.title}>Scripture</Text>
            <Text style={styles.subtitle}>{activeMeta.fullName}</Text>
          </View>
          <TouchableOpacity
            style={{
              backgroundColor: "#FF6B3518",
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#FF6B3544",
            }}
            onPress={() => router.push("/settings")}
          >
            <Text style={{ fontFamily: "Syne-Bold", fontSize: 12, color: "#FF6B35" }}>
              {activeTranslation} ▾
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* OT / NT Toggle */}
      <View style={styles.toggle}>
        {(["OT", "NT"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.toggleBtn, tab === t && styles.toggleActive]}
            onPress={() => setTab(t)}
          >
            <Text
              style={[styles.toggleText, tab === t && styles.toggleTextActive]}
            >
              {t === "OT" ? "Old Testament" : "New Testament"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Book Grid */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.bookCard}
            onPress={() => router.push(`/reader/${item.id}`)}
          >
            <Text style={styles.bookName} numberOfLines={2}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    topBar: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    backBtn: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 12,
      backgroundColor: c.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    backText: { fontFamily: "DMSans-Medium", fontSize: 14, color: "#FF6B35" },
    header: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 },
    title: { fontFamily: "Syne-Bold", fontSize: 32, color: c.text },
    subtitle: {
      fontFamily: "DMSans-Regular",
      fontSize: 13,
      color: c.muted,
      marginTop: 4,
    },
    toggle: {
      flexDirection: "row",
      marginHorizontal: 24,
      marginBottom: 20,
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 4,
    },
    toggleBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: "center",
    },
    toggleActive: { backgroundColor: "#FF6B35" },
    toggleText: { fontFamily: "DMSans-Medium", fontSize: 13, color: c.muted },
    toggleTextActive: { color: "#fff" },
    grid: { paddingHorizontal: 16, paddingBottom: 32 },
    bookCard: {
      flex: 1,
      margin: 6,
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 14,
      minHeight: 80,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.border,
    },
    bookName: {
      fontFamily: "DMSans-Medium",
      fontSize: 13,
      color: c.text,
      textAlign: "center",
    },
  });
}
