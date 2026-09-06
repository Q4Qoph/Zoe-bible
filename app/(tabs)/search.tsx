import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AppColors } from "../../constants/theme";
import { useDatabase } from "../../src/db";
import { useTheme } from "../../src/contexts/ThemeContext";
import {
  Book,
  ChapterVerse,
  getBooks,
  getVerse,
  SearchFacet,
  searchVerses,
} from "../../src/db/queries";
import { useUserDatabase } from "../../src/db/UserDatabaseContext";
import {
  searchUserBookmarks,
  searchUserNotes,
  searchUserSessions,
} from "../../src/db/userDb";
import {
  parseBibleReference,
  ParsedReference,
} from "../../src/utils/referenceParser";

type SearchScope = "scripture" | "notes" | "sermons" | "bookmarks";

interface ThematicCategory {
  title: string;
  icon: string;
  topics: string[];
}

const THEMATIC_CATEGORIES: ThematicCategory[] = [
  {
    title: "Peace & Comfort",
    icon: "shield-checkmark-outline",
    topics: ["peace", "anxiety", "comfort", "fear", "healing", "rest"],
  },
  {
    title: "Faith & Growth",
    icon: "sparkles-outline",
    topics: ["faith", "grace", "prayer", "wisdom", "hope", "trust"],
  },
  {
    title: "Love & Relationships",
    icon: "heart-outline",
    topics: ["love", "forgiveness", "joy", "patience", "family", "unity"],
  },
  {
    title: "Strength & Purpose",
    icon: "flame-outline",
    topics: ["strength", "courage", "salvation", "purpose", "eternal life"],
  },
];

const FACET_OPTIONS: { id: SearchFacet; label: string }[] = [
  { id: "all", label: "All Canon" },
  { id: "nt", label: "New Testament" },
  { id: "ot", label: "Old Testament" },
  { id: "gospels", label: "Gospels & Acts" },
  { id: "epistles", label: "Epistles" },
  { id: "wisdom", label: "Wisdom & Poetry" },
  { id: "prophets", label: "Prophets" },
  { id: "history", label: "History" },
];

const PAGE_SIZE = 25;

export default function SearchScreen() {
  const db = useDatabase();
  const userDb = useUserDatabase();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors);

  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<SearchScope>("scripture");
  const [facet, setFacet] = useState<SearchFacet>("all");

  // Results State
  const [scriptureResults, setScriptureResults] = useState<ChapterVerse[]>([]);
  const [noteResults, setNoteResults] = useState<any[]>([]);
  const [sessionResults, setSessionResults] = useState<any[]>([]);
  const [bookmarkResults, setBookmarkResults] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);

  // Reference quick-jump
  const [quickJumpRef, setQuickJumpRef] = useState<ParsedReference | null>(null);
  const [quickJumpPreview, setQuickJumpPreview] = useState<string | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load books & history
  useEffect(() => {
    getBooks(db).then(setAllBooks);
    AsyncStorage.getItem("search_history").then((v) => {
      if (v) setSearchHistory(JSON.parse(v));
    });
  }, [db]);

  const saveToHistory = async (term: string) => {
    if (!term.trim() || term.length < 2) return;
    const raw = await AsyncStorage.getItem("search_history");
    const prev: string[] = raw ? JSON.parse(raw) : [];
    const updated = [term.trim(), ...prev.filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, 8);
    await AsyncStorage.setItem("search_history", JSON.stringify(updated));
    setSearchHistory(updated);
  };

  const clearHistory = async () => {
    await AsyncStorage.removeItem("search_history");
    setSearchHistory([]);
  };

  const removeHistoryItem = async (term: string) => {
    const updated = searchHistory.filter((t) => t !== term);
    await AsyncStorage.setItem("search_history", JSON.stringify(updated));
    setSearchHistory(updated);
  };

  // Perform search across selected scope
  const executeSearch = useCallback(
    async (q: string, targetScope: SearchScope, targetFacet: SearchFacet, pageNum = 0) => {
      const trimmed = q.trim();
      if (!trimmed) {
        setScriptureResults([]);
        setNoteResults([]);
        setSessionResults([]);
        setBookmarkResults([]);
        setSearched(false);
        setQuickJumpRef(null);
        setQuickJumpPreview(null);
        return;
      }

      setLoading(true);
      setSearched(true);

      // 1. Check if query is a Bible reference
      if (allBooks.length > 0) {
        const parsed = parseBibleReference(trimmed, allBooks);
        if (parsed) {
          setQuickJumpRef(parsed);
          if (parsed.verse) {
            getVerse(db, parsed.bookId, parsed.chapter, parsed.verse).then((v) => {
              setQuickJumpPreview(v ? v.text : null);
            });
          } else {
            setQuickJumpPreview(null);
          }
        } else {
          setQuickJumpRef(null);
          setQuickJumpPreview(null);
        }
      }

      // 2. Fetch scoped content
      try {
        if (targetScope === "scripture") {
          const offset = pageNum * PAGE_SIZE;
          const found = await searchVerses(db, trimmed, PAGE_SIZE, offset, {
            facet: targetFacet,
          });
          if (pageNum === 0) {
            setScriptureResults(found);
          } else {
            setScriptureResults((prev) => [...prev, ...found]);
          }
          setHasMore(found.length === PAGE_SIZE);
          setPage(pageNum);
        } else if (targetScope === "notes") {
          const notes = await searchUserNotes(userDb, trimmed);
          setNoteResults(notes);
          setHasMore(false);
        } else if (targetScope === "sermons") {
          const sessions = await searchUserSessions(userDb, trimmed);
          setSessionResults(sessions);
          setHasMore(false);
        } else if (targetScope === "bookmarks") {
          const bms = await searchUserBookmarks(userDb, trimmed);
          setBookmarkResults(bms);
          setHasMore(false);
        }
      } catch (e) {
        console.warn("Search failed:", e);
      } finally {
        setLoading(false);
      }
    },
    [db, userDb, allBooks]
  );

  // Debounced typing handler
  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (!text.trim()) {
      setSearched(false);
      setQuickJumpRef(null);
      setQuickJumpPreview(null);
      setScriptureResults([]);
      return;
    }
    debounceTimerRef.current = setTimeout(() => {
      executeSearch(text, scope, facet, 0);
    }, 280);
  };

  const handleManualSearch = () => {
    Keyboard.dismiss();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    executeSearch(query, scope, facet, 0);
    if (query.trim()) saveToHistory(query);
  };

  const handleScopeChange = (newScope: SearchScope) => {
    setScope(newScope);
    if (query.trim()) {
      executeSearch(query, newScope, facet, 0);
    }
  };

  const handleFacetChange = (newFacet: SearchFacet) => {
    setFacet(newFacet);
    if (query.trim()) {
      executeSearch(query, "scripture", newFacet, 0);
    }
  };

  const handleQuickTopic = (topic: string) => {
    setQuery(topic);
    setScope("scripture");
    executeSearch(topic, "scripture", facet, 0);
    saveToHistory(topic);
  };

  const loadMore = () => {
    if (!hasMore || loading || scope !== "scripture") return;
    executeSearch(query, scope, facet, page + 1);
  };

  // Safe multi-token text highlighter
  const renderHighlightedText = (text: string, rawQuery: string) => {
    if (!rawQuery.trim()) {
      return <Text style={styles.verseText}>{text}</Text>;
    }
    const cleanWords = rawQuery
      .trim()
      .replace(/[^\w\s]/gi, " ")
      .split(/\s+/)
      .filter((w) => w.length > 0);

    if (cleanWords.length === 0) {
      return <Text style={styles.verseText}>{text}</Text>;
    }

    const regex = new RegExp(`(${cleanWords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
    const parts = text.split(regex);

    return (
      <Text style={styles.verseText}>
        {parts.map((part, i) => {
          const isMatch = cleanWords.some((w) => w.toLowerCase() === part.toLowerCase());
          return isMatch ? (
            <Text key={i} style={styles.highlightText}>
              {part}
            </Text>
          ) : (
            <Text key={i}>{part}</Text>
          );
        })}
      </Text>
    );
  };

  const handleShareVerse = async (v: ChapterVerse) => {
    await Share.share({
      message: `"${v.text}" — ${v.book_name} ${v.chapter}:${v.verse} (BSB)`,
    });
  };

  const handleOpenScripture = (bookId: number, chapter: number, verse?: number) => {
    if (verse) {
      router.push({
        pathname: "/reader/[bookId]/[chapter]",
        params: { bookId: bookId.toString(), chapter: chapter.toString(), verse: verse.toString() },
      });
    } else {
      router.push({
        pathname: "/reader/[bookId]/[chapter]",
        params: { bookId: bookId.toString(), chapter: chapter.toString() },
      });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <Text style={styles.subtitle}>Scripture, study notes & sermon sessions</Text>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.muted} style={{ marginRight: 10 }} />
          <TextInput
            style={styles.input}
            placeholder="Search scripture, 'Jn 3:16', notes..."
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={handleQueryChange}
            onSubmitEditing={handleManualSearch}
            returnKeyType="search"
            autoCorrect={false}
          />
          {loading && (
            <ActivityIndicator size="small" color="#FF6B35" style={{ marginRight: 6 }} />
          )}
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery("");
                setSearched(false);
                setQuickJumpRef(null);
                setQuickJumpPreview(null);
                setScriptureResults([]);
              }}
            >
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={handleManualSearch}>
          <Text style={styles.searchBtnText}>Go</Text>
        </TouchableOpacity>
      </View>

      {/* Scope Selector (Scripture / Notes / Sermons / Bookmarks) */}
      <View style={styles.scopeContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scopeScroll}>
          <TouchableOpacity
            style={[styles.scopeTab, scope === "scripture" && styles.scopeTabActive]}
            onPress={() => handleScopeChange("scripture")}
          >
            <Ionicons
              name="book-outline"
              size={14}
              color={scope === "scripture" ? "#fff" : colors.muted}
            />
            <Text style={[styles.scopeTabText, scope === "scripture" && styles.scopeTabTextActive]}>
              Scripture
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.scopeTab, scope === "notes" && styles.scopeTabActive]}
            onPress={() => handleScopeChange("notes")}
          >
            <Ionicons
              name="create-outline"
              size={14}
              color={scope === "notes" ? "#fff" : colors.muted}
            />
            <Text style={[styles.scopeTabText, scope === "notes" && styles.scopeTabTextActive]}>
              My Notes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.scopeTab, scope === "sermons" && styles.scopeTabActive]}
            onPress={() => handleScopeChange("sermons")}
          >
            <Ionicons
              name="mic-outline"
              size={14}
              color={scope === "sermons" ? "#fff" : colors.muted}
            />
            <Text style={[styles.scopeTabText, scope === "sermons" && styles.scopeTabTextActive]}>
              Sermons
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.scopeTab, scope === "bookmarks" && styles.scopeTabActive]}
            onPress={() => handleScopeChange("bookmarks")}
          >
            <Ionicons
              name="bookmark-outline"
              size={14}
              color={scope === "bookmarks" ? "#fff" : colors.muted}
            />
            <Text style={[styles.scopeTabText, scope === "bookmarks" && styles.scopeTabTextActive]}>
              Bookmarks
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Faceted Filters for Scripture */}
      {scope === "scripture" && searched && (
        <View style={styles.facetContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.facetScroll}>
            {FACET_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.facetPill, facet === item.id && styles.facetPillActive]}
                onPress={() => handleFacetChange(item.id)}
              >
                <Text style={[styles.facetText, facet === item.id && styles.facetTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Quick Jump Hero Card when Reference Detected */}
      {quickJumpRef && (
        <TouchableOpacity
          style={styles.quickJumpCard}
          onPress={() => handleOpenScripture(quickJumpRef.bookId, quickJumpRef.chapter, quickJumpRef.verse)}
          activeOpacity={0.85}
        >
          <View style={styles.quickJumpHeader}>
            <View style={styles.quickJumpBadge}>
              <Ionicons name="flash" size={12} color="#FF6B35" />
              <Text style={styles.quickJumpBadgeText}>QUICK JUMP</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={styles.quickJumpActionText}>Read Passage</Text>
              <Ionicons name="arrow-forward" size={14} color="#FF6B35" />
            </View>
          </View>
          <Text style={styles.quickJumpRef}>{quickJumpRef.formattedRef}</Text>
          {quickJumpPreview && (
            <Text style={styles.quickJumpPreview} numberOfLines={2}>
              "{quickJumpPreview}"
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* ZERO STATE: Recent Searches & Thematic Categories */}
      {!searched && (
        <ScrollView style={styles.zeroStateScroll} showsVerticalScrollIndicator={false}>
          {/* Recent Searches */}
          {searchHistory.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <TouchableOpacity onPress={clearHistory}>
                  <Text style={styles.clearText}>Clear all</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.historyList}>
                {searchHistory.map((item) => (
                  <View key={item} style={styles.historyItemRow}>
                    <TouchableOpacity
                      style={styles.historyItemBtn}
                      onPress={() => handleQuickTopic(item)}
                    >
                      <Ionicons name="time-outline" size={16} color={colors.muted} />
                      <Text style={styles.historyItemText}>{item}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => removeHistoryItem(item)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close" size={16} color={colors.muted} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Categorized Thematic Topics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Browse Scripture by Topic</Text>
            {THEMATIC_CATEGORIES.map((cat) => (
              <View key={cat.title} style={styles.categoryBlock}>
                <View style={styles.categoryHeader}>
                  <Ionicons name={cat.icon as any} size={15} color="#FF6B35" />
                  <Text style={styles.categoryTitle}>{cat.title}</Text>
                </View>
                <View style={styles.chips}>
                  {cat.topics.map((topic) => (
                    <TouchableOpacity
                      key={topic}
                      style={styles.chip}
                      onPress={() => handleQuickTopic(topic)}
                    >
                      <Text style={styles.chipText}>{topic}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* RESULTS LISTS */}
      {searched && (
        <View style={{ flex: 1 }}>
          {/* Scripture Results */}
          {scope === "scripture" && (
            <FlatList
              data={scriptureResults}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                <Text style={styles.resultCount}>
                  {scriptureResults.length === 0 && !loading
                    ? "No verses found"
                    : `${scriptureResults.length}${hasMore ? "+" : ""} verse${scriptureResults.length !== 1 ? "s" : ""} found`}
                </Text>
              }
              renderItem={({ item }) => {
                const isNT = item.book_id >= 40;
                return (
                  <TouchableOpacity
                    style={styles.resultCard}
                    onPress={() => handleOpenScripture(item.book_id, item.chapter, item.verse)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.refRow}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={styles.ref}>
                          {item.book_name} {item.chapter}:{item.verse}
                        </Text>
                        <View style={[styles.testamentTag, isNT ? styles.ntTag : styles.otTag]}>
                          <Text style={[styles.testamentTagText, isNT ? styles.ntTagText : styles.otTagText]}>
                            {isNT ? "NT" : "OT"}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleShareVerse(item)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="share-outline" size={16} color={colors.muted} />
                      </TouchableOpacity>
                    </View>
                    {renderHighlightedText(item.text, query)}
                  </TouchableOpacity>
                );
              }}
              ListFooterComponent={
                hasMore ? (
                  <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore}>
                    <Text style={styles.loadMoreText}>Load more verses</Text>
                  </TouchableOpacity>
                ) : null
              }
              ListEmptyComponent={
                !loading ? (
                  <View style={styles.centered}>
                    <Text style={styles.emptyIcon}>📖</Text>
                    <Text style={styles.emptyText}>No verses found for "{query}"</Text>
                    <Text style={styles.emptySub}>Try searching a different keyword or reference</Text>
                  </View>
                ) : null
              }
            />
          )}

          {/* User Notes Results */}
          {scope === "notes" && (
            <FlatList
              data={noteResults}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                <Text style={styles.resultCount}>
                  {noteResults.length} note{noteResults.length !== 1 ? "s" : ""} found
                </Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultCard}
                  onPress={() => handleOpenScripture(item.book_id, item.chapter, item.verse)}
                >
                  <View style={styles.refRow}>
                    <Text style={styles.ref}>
                      {item.book_name} {item.chapter}:{item.verse}
                    </Text>
                    <Text style={styles.dateBadge}>{item.created_at?.slice(0, 10)}</Text>
                  </View>
                  <Text style={styles.noteContent}>{item.note}</Text>
                  <Text style={styles.noteVerseSnippet} numberOfLines={2}>
                    "{item.verse_text}"
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                !loading ? (
                  <View style={styles.centered}>
                    <Text style={styles.emptyIcon}>📝</Text>
                    <Text style={styles.emptyText}>No study notes found</Text>
                    <Text style={styles.emptySub}>Notes matching "{query}" will appear here</Text>
                  </View>
                ) : null
              }
            />
          )}

          {/* Sermon Sessions Results */}
          {scope === "sermons" && (
            <FlatList
              data={sessionResults}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                <Text style={styles.resultCount}>
                  {sessionResults.length} sermon{sessionResults.length !== 1 ? "s" : ""} found
                </Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultCard}
                  onPress={() => router.push("/(tabs)/session")}
                >
                  <View style={styles.refRow}>
                    <Text style={styles.ref}>{item.topic || "Untitled Sermon"}</Text>
                    <Text style={styles.dateBadge}>{item.date}</Text>
                  </View>
                  {item.speaker ? (
                    <Text style={styles.sermonSpeaker}>Speaker: {item.speaker}</Text>
                  ) : null}
                  <Text style={styles.noteContent} numberOfLines={3}>
                    {typeof item.notes === "string" ? item.notes.replace(/[[\]"]/g, " ") : ""}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                !loading ? (
                  <View style={styles.centered}>
                    <Text style={styles.emptyIcon}>🎙️</Text>
                    <Text style={styles.emptyText}>No sermon notes found</Text>
                    <Text style={styles.emptySub}>Sermons matching "{query}" will appear here</Text>
                  </View>
                ) : null
              }
            />
          )}

          {/* Bookmarks Results */}
          {scope === "bookmarks" && (
            <FlatList
              data={bookmarkResults}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                <Text style={styles.resultCount}>
                  {bookmarkResults.length} bookmark{bookmarkResults.length !== 1 ? "s" : ""} found
                </Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultCard}
                  onPress={() => handleOpenScripture(item.book_id, item.chapter, item.verse)}
                >
                  <View style={styles.refRow}>
                    <Text style={styles.ref}>
                      {item.book_name} {item.chapter}:{item.verse}
                    </Text>
                    <Ionicons name="bookmark" size={16} color="#FF6B35" />
                  </View>
                  <Text style={styles.verseText}>{item.text}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                !loading ? (
                  <View style={styles.centered}>
                    <Text style={styles.emptyIcon}>🔖</Text>
                    <Text style={styles.emptyText}>No bookmarks found</Text>
                    <Text style={styles.emptySub}>Saved verses matching "{query}" will appear here</Text>
                  </View>
                ) : null
              }
            />
          )}
        </View>
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

    searchRow: {
      flexDirection: "row",
      paddingHorizontal: 24,
      marginBottom: 12,
      gap: 10,
      alignItems: "center",
    },
    searchBox: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.surface,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    input: { flex: 1, fontFamily: "DMSans-Regular", fontSize: 15, color: c.text },
    searchBtn: {
      backgroundColor: "#FF6B35",
      borderRadius: 14,
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    searchBtnText: { fontFamily: "Syne-Bold", fontSize: 14, color: "#fff" },

    scopeContainer: { marginBottom: 10 },
    scopeScroll: { paddingHorizontal: 24, gap: 8 },
    scopeTab: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: c.surface,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
    },
    scopeTabActive: {
      backgroundColor: "#FF6B35",
      borderColor: "#FF6B35",
    },
    scopeTabText: { fontFamily: "DMSans-Medium", fontSize: 12, color: c.muted },
    scopeTabTextActive: { color: "#fff" },

    facetContainer: { marginBottom: 12 },
    facetScroll: { paddingHorizontal: 24, gap: 6 },
    facetPill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    facetPillActive: {
      backgroundColor: "#FF6B3522",
      borderColor: "#FF6B35",
    },
    facetText: { fontFamily: "DMSans-Regular", fontSize: 11, color: c.muted },
    facetTextActive: { color: "#FF6B35", fontFamily: "DMSans-Medium" },

    quickJumpCard: {
      marginHorizontal: 24,
      marginBottom: 16,
      padding: 16,
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: "#FF6B3566",
      shadowColor: "#FF6B35",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    quickJumpHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    quickJumpBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "#FF6B3518",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    quickJumpBadgeText: { fontFamily: "Syne-Bold", fontSize: 10, color: "#FF6B35", letterSpacing: 0.5 },
    quickJumpActionText: { fontFamily: "DMSans-Medium", fontSize: 12, color: "#FF6B35" },
    quickJumpRef: { fontFamily: "Syne-Bold", fontSize: 20, color: c.text, marginBottom: 4 },
    quickJumpPreview: { fontFamily: "Lora-Regular", fontSize: 14, color: c.muted, fontStyle: "italic", lineHeight: 20 },

    zeroStateScroll: { flex: 1 },
    section: { paddingHorizontal: 24, marginBottom: 24 },
    sectionHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    sectionTitle: { fontFamily: "Syne-Bold", fontSize: 16, color: c.text, marginBottom: 12 },
    clearText: { fontFamily: "DMSans-Medium", fontSize: 12, color: "#FF6B35" },
    historyList: { backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, overflow: "hidden" },
    historyItemRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    historyItemBtn: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
    historyItemText: { fontFamily: "DMSans-Regular", fontSize: 14, color: c.text },

    categoryBlock: { marginBottom: 16 },
    categoryHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
    categoryTitle: { fontFamily: "DMSans-Medium", fontSize: 13, color: c.muted },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      backgroundColor: c.surface,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipText: { fontFamily: "DMSans-Medium", fontSize: 12, color: c.text },

    resultCount: {
      fontFamily: "DMSans-Medium",
      fontSize: 12,
      color: c.muted,
      marginBottom: 10,
    },
    list: { paddingHorizontal: 24, paddingBottom: 40 },
    resultCard: {
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    refRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    ref: { fontFamily: "Syne-Bold", fontSize: 13, color: "#FF6B35" },
    testamentTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    ntTag: { backgroundColor: "#06D6A018" },
    otTag: { backgroundColor: "#7C3AED18" },
    testamentTagText: { fontSize: 10, fontFamily: "Syne-Bold" },
    ntTagText: { color: "#06D6A0" },
    otTagText: { color: "#7C3AED" },
    dateBadge: { fontFamily: "DMSans-Regular", fontSize: 11, color: c.muted },
    sermonSpeaker: { fontFamily: "DMSans-Medium", fontSize: 12, color: "#7C3AED", marginBottom: 6 },
    noteContent: { fontFamily: "DMSans-Regular", fontSize: 14, color: c.text, lineHeight: 22, marginBottom: 6 },
    noteVerseSnippet: { fontFamily: "Lora-Regular", fontSize: 12, color: c.muted, fontStyle: "italic" },
    verseText: { fontFamily: "Lora-Regular", fontSize: 15, color: c.text, lineHeight: 24 },
    highlightText: {
      backgroundColor: "#FF6B3533",
      color: "#FF6B35",
      fontFamily: "Lora-Bold",
    },
    loadMoreBtn: {
      alignItems: "center",
      paddingVertical: 14,
      marginBottom: 20,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    loadMoreText: { fontFamily: "DMSans-Medium", fontSize: 14, color: "#FF6B35" },

    centered: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 40 },
    emptyIcon: { fontSize: 36, marginBottom: 10 },
    emptyText: { fontFamily: "Syne-Bold", fontSize: 15, color: c.text, marginBottom: 4 },
    emptySub: { fontFamily: "DMSans-Regular", fontSize: 12, color: c.muted, textAlign: "center", paddingHorizontal: 20 },
  });
}
