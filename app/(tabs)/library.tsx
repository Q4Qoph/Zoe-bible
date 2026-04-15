import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppColors } from "../../constants/theme";
import { useTheme } from "../../src/contexts/ThemeContext";
import { useUserDatabase } from "../../src/db/UserDatabaseContext";
import {
  getActivePlans,
  getBookmarks,
  getCustomPlans,
  getHighlights,
  getNotes,
  removeBookmark,
  removeHighlight,
  removeNote,
} from "../../src/db/userDb";

type Tab = "bookmarks" | "highlights" | "notes" | "plans";

export default function LibraryScreen() {
  const userDb = useUserDatabase();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [tab, setTab] = useState<Tab>("bookmarks");
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [customPlans, setCustomPlans] = useState<any[]>([]);

  const load = async () => {
    setBookmarks(await getBookmarks(userDb));
    setHighlights(await getHighlights(userDb));
    setNotes(await getNotes(userDb));
    setPlans(await getActivePlans(userDb));
    setCustomPlans(await getCustomPlans(userDb));
  };

  useEffect(() => { load(); }, []);

  const confirmDelete = (label: string, onDelete: () => void) => {
    Alert.alert("Delete", `Remove this ${label}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: onDelete },
    ]);
  };

  const styles = makeStyles(colors);

  const tabs: { key: Tab; label: string; icon: string; count: number }[] = [
    { key: "bookmarks", label: "Bookmarks", icon: "bookmark", count: bookmarks.length },
    { key: "highlights", label: "Highlights", icon: "color-fill", count: highlights.length },
    { key: "notes", label: "Notes", icon: "create", count: notes.length },
    { key: "plans", label: "Plans", icon: "calendar", count: plans.length + customPlans.length },
  ];

  const renderBookmark = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/reader/${item.book_id}/${item.chapter}`)}
    >
      <View style={styles.cardTop}>
        <Text style={styles.ref}>{item.book_name} {item.chapter}:{item.verse}</Text>
        <TouchableOpacity onPress={() => confirmDelete("bookmark", async () => { await removeBookmark(userDb, item.id); load(); })}>
          <Ionicons name="trash-outline" size={16} color={colors.muted} />
        </TouchableOpacity>
      </View>
      <Text style={styles.verseText} numberOfLines={3}>{item.text}</Text>
      <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
    </TouchableOpacity>
  );

  const renderHighlight = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.card, { borderLeftWidth: 4, borderLeftColor: item.color }]}
      onPress={() => router.push(`/reader/${item.book_id}/${item.chapter}`)}
    >
      <View style={styles.cardTop}>
        <Text style={styles.ref}>{item.book_name} {item.chapter}:{item.verse}</Text>
        <TouchableOpacity onPress={() => confirmDelete("highlight", async () => { await removeHighlight(userDb, item.id); load(); })}>
          <Ionicons name="trash-outline" size={16} color={colors.muted} />
        </TouchableOpacity>
      </View>
      <Text style={[styles.verseText, { color: item.color }]} numberOfLines={3}>{item.text}</Text>
    </TouchableOpacity>
  );

  const renderNote = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/reader/${item.book_id}/${item.chapter}`)}
    >
      <View style={styles.cardTop}>
        <Text style={styles.ref}>{item.book_name} {item.chapter}:{item.verse}</Text>
        <TouchableOpacity onPress={() => confirmDelete("note", async () => { await removeNote(userDb, item.id); load(); })}>
          <Ionicons name="trash-outline" size={16} color={colors.muted} />
        </TouchableOpacity>
      </View>
      <Text style={styles.verseText} numberOfLines={2}>{item.verse_text}</Text>
      <View style={styles.noteBubble}>
        <Ionicons name="create-outline" size={12} color="#06D6A0" />
        <Text style={styles.noteText}>{item.note}</Text>
      </View>
      <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
    </TouchableOpacity>
  );

  const renderPlan = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/plan/${item.plan_id}`)}
    >
      <View style={styles.cardTop}>
        <Text style={styles.ref}>{item.plan_name}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.muted} />
      </View>
      <Text style={styles.date}>Started {new Date(item.started_at).toLocaleDateString()}</Text>
    </TouchableOpacity>
  );

  const data = tab === "bookmarks" ? bookmarks : tab === "highlights" ? highlights : tab === "notes" ? notes : plans;
  const renderItem = tab === "bookmarks" ? renderBookmark : tab === "highlights" ? renderHighlight : tab === "notes" ? renderNote : renderPlan;

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
        <Text style={styles.subtitle}>Your saved scripture</Text>
      </View>

      <View style={styles.tabsSection}>
        <Text style={styles.activeTabLabel}>
          {tabs.find((t) => t.key === tab)?.label}
        </Text>
        <View style={styles.tabs}>
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabBtn, tab === t.key && styles.tabActive]}
              onPress={() => setTab(t.key)}
            >
              <Ionicons name={t.icon as any} size={20} color={tab === t.key ? "#FF6B35" : colors.muted} />
              {t.count > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{t.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {tab === "plans" ? (
        <ScrollView contentContainerStyle={styles.list}>
          {/* Create plan button */}
          <TouchableOpacity
            style={styles.createPlanBtn}
            onPress={() => router.push("/plan/create" as any)}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FF6B35" />
            <Text style={styles.createPlanText}>Create Custom Plan</Text>
          </TouchableOpacity>

          {/* Enrolled plans */}
          {plans.length > 0 && (
            <Text style={styles.planSectionLabel}>ENROLLED</Text>
          )}
          {plans.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => router.push(`/plan/${item.plan_id}`)}
            >
              <View style={styles.cardTop}>
                <Text style={styles.ref}>{item.plan_name}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </View>
              <Text style={styles.date}>Started {new Date(item.started_at).toLocaleDateString()}</Text>
            </TouchableOpacity>
          ))}

          {/* Custom plans */}
          {customPlans.length > 0 && (
            <Text style={styles.planSectionLabel}>MY PLANS</Text>
          )}
          {customPlans.map((item) => (
            <TouchableOpacity
              key={item.plan_id}
              style={[styles.card, { borderLeftWidth: 3, borderLeftColor: item.color }]}
              onPress={() => router.push(`/plan/${item.plan_id}`)}
            >
              <View style={styles.cardTop}>
                <Text style={styles.planEmoji}>{item.icon}</Text>
                <Text style={[styles.ref, { flex: 1 }]}>{item.name}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </View>
              <Text style={styles.date}>Created {new Date(item.created_at).toLocaleDateString()}</Text>
            </TouchableOpacity>
          ))}

          {plans.length === 0 && customPlans.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyText}>No plans yet</Text>
              <Text style={styles.emptySub}>Create a custom plan or enroll in one from the home screen</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={renderItem as any}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>
                {tab === "bookmarks" ? "🔖" : tab === "highlights" ? "🎨" : "📝"}
              </Text>
              <Text style={styles.emptyText}>No {tab} yet</Text>
              <Text style={styles.emptySub}>
                {tab === "bookmarks"
                  ? "Tap a verse while reading to bookmark it"
                  : tab === "highlights"
                    ? "Tap a verse to highlight it with a color"
                    : "Tap a verse to add a note"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 },
    title: { fontFamily: "Syne-Bold", fontSize: 32, color: c.text },
    subtitle: { fontFamily: "DMSans-Regular", fontSize: 13, color: c.muted, marginTop: 4 },

    tabsSection: { paddingHorizontal: 24, marginBottom: 20 },
    activeTabLabel: { fontFamily: "Syne-Bold", fontSize: 18, color: "#FF6B35", marginBottom: 10 },
    tabs: { flexDirection: "row", gap: 8 },
    tabBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    tabActive: { borderColor: "#FF6B35", backgroundColor: "#FF6B3511" },
    badge: { backgroundColor: "#FF6B35", borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
    badgeText: { fontFamily: "DMSans-Medium", fontSize: 10, color: "#fff" },

    list: { paddingHorizontal: 24, paddingBottom: 40 },
    card: {
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    cardTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
    ref: { fontFamily: "Syne-Bold", fontSize: 13, color: "#FF6B35" },
    verseText: { fontFamily: "Lora-Regular", fontSize: 14, color: c.text, lineHeight: 22 },
    date: { fontFamily: "DMSans-Regular", fontSize: 11, color: c.muted, marginTop: 8 },
    noteBubble: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 6,
      backgroundColor: "#06D6A011",
      borderRadius: 8,
      padding: 10,
      marginTop: 10,
    },
    noteText: { fontFamily: "DMSans-Regular", fontSize: 13, color: "#06D6A0", flex: 1 },

    createPlanBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 8, padding: 14, borderRadius: 14, borderWidth: 1.5,
      borderColor: "#FF6B3544", backgroundColor: "#FF6B3511", marginBottom: 16,
    },
    createPlanText: { fontFamily: "DMSans-Medium", fontSize: 14, color: "#FF6B35" },
    planSectionLabel: {
      fontFamily: "DMSans-Medium", fontSize: 11, color: c.muted,
      letterSpacing: 1, marginBottom: 8, marginTop: 4,
    },
    planEmoji: { fontSize: 16, marginRight: 4 },
    empty: { alignItems: "center", paddingTop: 80 },
    emptyIcon: { fontSize: 40, marginBottom: 12 },
    emptyText: { fontFamily: "Syne-Bold", fontSize: 18, color: c.text, marginBottom: 6 },
    emptySub: { fontFamily: "DMSans-Regular", fontSize: 13, color: c.muted, textAlign: "center", maxWidth: 260 },
  });
}
