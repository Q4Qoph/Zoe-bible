import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useUserDatabase } from "../../src/db/UserDatabaseContext";
import {
    getBookmarks,
    getHighlights,
    getNotes,
    removeBookmark,
    removeHighlight,
    removeNote,
} from "../../src/db/userDb";

type Tab = "bookmarks" | "highlights" | "notes";

export default function LibraryScreen() {
  const userDb = useUserDatabase();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("bookmarks");
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);

  const load = async () => {
    setBookmarks(await getBookmarks(userDb));
    setHighlights(await getHighlights(userDb));
    setNotes(await getNotes(userDb));
  };

  useEffect(() => {
    load();
  }, []);

  const confirmDelete = (label: string, onDelete: () => void) => {
    Alert.alert("Delete", `Remove this ${label}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: onDelete },
    ]);
  };

  const tabs: { key: Tab; label: string; icon: string; count: number }[] = [
    {
      key: "bookmarks",
      label: "Bookmarks",
      icon: "bookmark",
      count: bookmarks.length,
    },
    {
      key: "highlights",
      label: "Highlights",
      icon: "color-fill",
      count: highlights.length,
    },
    { key: "notes", label: "Notes", icon: "create", count: notes.length },
  ];

  const renderBookmark = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/reader/${item.book_id}/${item.chapter}`)}
    >
      <View style={styles.cardTop}>
        <Text style={styles.ref}>
          {item.book_name} {item.chapter}:{item.verse}
        </Text>
        <TouchableOpacity
          onPress={() =>
            confirmDelete("bookmark", async () => {
              await removeBookmark(userDb, item.id);
              load();
            })
          }
        >
          <Ionicons name="trash-outline" size={16} color="#6B6B80" />
        </TouchableOpacity>
      </View>
      <Text style={styles.verseText} numberOfLines={3}>
        {item.text}
      </Text>
      <Text style={styles.date}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  const renderHighlight = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.card, { borderLeftWidth: 4, borderLeftColor: item.color }]}
      onPress={() => router.push(`/reader/${item.book_id}/${item.chapter}`)}
    >
      <View style={styles.cardTop}>
        <Text style={styles.ref}>
          {item.book_name} {item.chapter}:{item.verse}
        </Text>
        <TouchableOpacity
          onPress={() =>
            confirmDelete("highlight", async () => {
              await removeHighlight(userDb, item.id);
              load();
            })
          }
        >
          <Ionicons name="trash-outline" size={16} color="#6B6B80" />
        </TouchableOpacity>
      </View>
      <Text style={[styles.verseText, { color: item.color }]} numberOfLines={3}>
        {item.text}
      </Text>
    </TouchableOpacity>
  );

  const renderNote = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/reader/${item.book_id}/${item.chapter}`)}
    >
      <View style={styles.cardTop}>
        <Text style={styles.ref}>
          {item.book_name} {item.chapter}:{item.verse}
        </Text>
        <TouchableOpacity
          onPress={() =>
            confirmDelete("note", async () => {
              await removeNote(userDb, item.id);
              load();
            })
          }
        >
          <Ionicons name="trash-outline" size={16} color="#6B6B80" />
        </TouchableOpacity>
      </View>
      <Text style={styles.verseText} numberOfLines={2}>
        {item.verse_text}
      </Text>
      <View style={styles.noteBubble}>
        <Ionicons name="create-outline" size={12} color="#06D6A0" />
        <Text style={styles.noteText}>{item.note}</Text>
      </View>
      <Text style={styles.date}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  const data =
    tab === "bookmarks" ? bookmarks : tab === "highlights" ? highlights : notes;
  const renderItem =
    tab === "bookmarks"
      ? renderBookmark
      : tab === "highlights"
        ? renderHighlight
        : renderNote;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />

      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
        <Text style={styles.subtitle}>Your saved scripture</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Ionicons
              name={t.icon as any}
              size={16}
              color={tab === t.key ? "#FF6B35" : "#6B6B80"}
            />
            <Text
              style={[styles.tabText, tab === t.key && styles.tabTextActive]}
            >
              {t.label}
            </Text>
            {t.count > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F14" },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 },
  title: { fontFamily: "Syne-Bold", fontSize: 32, color: "#F5F5F5" },
  subtitle: {
    fontFamily: "DMSans-Regular",
    fontSize: 13,
    color: "#6B6B80",
    marginTop: 4,
  },

  tabs: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginBottom: 20,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#1A1A24",
    borderWidth: 1,
    borderColor: "#2A2A38",
  },
  tabActive: { borderColor: "#FF6B35", backgroundColor: "#FF6B3511" },
  tabText: { fontFamily: "DMSans-Medium", fontSize: 12, color: "#6B6B80" },
  tabTextActive: { color: "#FF6B35" },
  badge: {
    backgroundColor: "#FF6B35",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeText: { fontFamily: "DMSans-Medium", fontSize: 10, color: "#fff" },

  list: { paddingHorizontal: 24, paddingBottom: 40 },
  card: {
    backgroundColor: "#1A1A24",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2A2A38",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  ref: { fontFamily: "Syne-Bold", fontSize: 13, color: "#FF6B35" },
  verseText: {
    fontFamily: "Lora-Regular",
    fontSize: 14,
    color: "#F5F5F5",
    lineHeight: 22,
  },
  date: {
    fontFamily: "DMSans-Regular",
    fontSize: 11,
    color: "#6B6B80",
    marginTop: 8,
  },
  noteBubble: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "#06D6A011",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  noteText: {
    fontFamily: "DMSans-Regular",
    fontSize: 13,
    color: "#06D6A0",
    flex: 1,
  },

  empty: { alignItems: "center", paddingTop: 80 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: {
    fontFamily: "Syne-Bold",
    fontSize: 18,
    color: "#F5F5F5",
    marginBottom: 6,
  },
  emptySub: {
    fontFamily: "DMSans-Regular",
    fontSize: 13,
    color: "#6B6B80",
    textAlign: "center",
    maxWidth: 260,
  },
});
