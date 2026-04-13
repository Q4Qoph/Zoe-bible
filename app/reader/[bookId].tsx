import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useDatabase } from "../../src/db";
import { Book, getBooks, getChapterCount } from "../../src/db/queries";

export default function ChaptersScreen() {
  const db = useDatabase();
  const router = useRouter();
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [chapterCount, setChapterCount] = useState(0);

  useEffect(() => {
    const id = parseInt(bookId);
    getBooks(db).then((books) =>
      setBook(books.find((b) => b.id === id) || null),
    );
    getChapterCount(db, id).then(setChapterCount);
  }, [bookId]);

  const chapters = Array.from({ length: chapterCount }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: book?.name || "Chapters" }} />

      <View style={styles.header}>
        <Text style={styles.title}>{book?.name}</Text>
        <Text style={styles.subtitle}>{chapterCount} Chapters</Text>
      </View>

      <FlatList
        data={chapters}
        keyExtractor={(item) => item.toString()}
        numColumns={5}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chapterBtn}
            onPress={() => router.push(`/reader/${bookId}/${item}`)}
          >
            <Text style={styles.chapterText}>{item}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F14" },
  header: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24 },
  title: { fontFamily: "Syne-Bold", fontSize: 28, color: "#F5F5F5" },
  subtitle: {
    fontFamily: "DMSans-Regular",
    fontSize: 13,
    color: "#6B6B80",
    marginTop: 4,
  },
  grid: { paddingHorizontal: 16, paddingBottom: 32 },
  chapterBtn: {
    flex: 1,
    margin: 6,
    backgroundColor: "#1A1A24",
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A38",
  },
  chapterText: { fontFamily: "Syne-Bold", fontSize: 16, color: "#FF6B35" },
});
