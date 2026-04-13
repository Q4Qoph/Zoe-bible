import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useDatabase } from "../../src/db";
import { Book, getBooks } from "../../src/db/queries";

const OLD_TESTAMENT_COUNT = 39;

export default function BooksScreen() {
  const db = useDatabase();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [tab, setTab] = useState<"OT" | "NT">("OT");

  useEffect(() => {
    getBooks(db).then(setBooks);
  }, []);

  const filtered = books.filter((b) =>
    tab === "OT" ? b.id <= OLD_TESTAMENT_COUNT : b.id > OLD_TESTAMENT_COUNT,
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Scripture</Text>
        <Text style={styles.subtitle}>Berean Standard Bible</Text>
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
  toggle: {
    flexDirection: "row",
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: "#1A1A24",
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
  toggleText: { fontFamily: "DMSans-Medium", fontSize: 13, color: "#6B6B80" },
  toggleTextActive: { color: "#fff" },
  grid: { paddingHorizontal: 16, paddingBottom: 32 },
  bookCard: {
    flex: 1,
    margin: 6,
    backgroundColor: "#1A1A24",
    borderRadius: 14,
    padding: 14,
    minHeight: 80,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A38",
  },
  bookName: {
    fontFamily: "DMSans-Medium",
    fontSize: 13,
    color: "#F5F5F5",
    textAlign: "center",
  },
});
