import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppColors } from "../constants/theme";
import { ChapterVerse, getVerse } from "../src/db/queries";
import { useTheme } from "../src/contexts/ThemeContext";
import {
  CrossReference,
  getVerseCrossReferences,
} from "../src/data/crossReferences";
import {
  findStrongsForVerse,
  STRONGS_LEXICON,
  StrongsEntry,
} from "../src/data/strongsLexicon";
import { SQLiteDatabase } from "expo-sqlite";

interface StudyDrawerProps {
  visible: boolean;
  verse: ChapterVerse | null;
  db: SQLiteDatabase;
  initialTab?: "crossref" | "lexicon";
  onClose: () => void;
  onNavigateToPassage: (bookId: number, chapter: number, verse: number) => void;
}

interface ResolvedCrossReference extends CrossReference {
  previewText?: string;
  loading?: boolean;
}

export default function StudyDrawer({
  visible,
  verse,
  db,
  initialTab = "crossref",
  onClose,
  onNavigateToPassage,
}: StudyDrawerProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [activeTab, setActiveTab] = useState<"crossref" | "lexicon">(initialTab);
  const [crossRefs, setCrossRefs] = useState<ResolvedCrossReference[]>([]);
  const [strongsEntries, setStrongsEntries] = useState<StrongsEntry[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, visible]);

  useEffect(() => {
    if (!verse || !visible) return;

    // Load Strong's lexicon entries
    const entries = findStrongsForVerse(verse.text);
    // If no specific match was found, provide general theological roots
    if (entries.length === 0) {
      const isNT = verse.book_id >= 40;
      const defaults = isNT
        ? [STRONGS_LEXICON.G26, STRONGS_LEXICON.G5485, STRONGS_LEXICON.G4102]
        : [STRONGS_LEXICON.H7965, STRONGS_LEXICON.H2617, STRONGS_LEXICON.H1254];
      setStrongsEntries(defaults.filter(Boolean));
    } else {
      setStrongsEntries(entries);
    }

    // Load Cross-references
    const rawRefs = getVerseCrossReferences(verse.book_id, verse.chapter, verse.verse);
    if (rawRefs.length === 0) {
      setCrossRefs([]);
      return;
    }

    setLoadingRefs(true);
    Promise.all(
      rawRefs.map(async (ref) => {
        const target = await getVerse(db, ref.toBookId, ref.toChapter, ref.toVerse);
        return {
          ...ref,
          previewText: target ? target.text : undefined,
        };
      })
    )
      .then((resolved) => {
        setCrossRefs(resolved);
        setLoadingRefs(false);
      })
      .catch(() => {
        setCrossRefs(rawRefs);
        setLoadingRefs(false);
      });
  }, [verse, visible, db]);

  if (!verse) return null;

  const handleShare = async () => {
    await Share.share({
      message: `"${verse.text}" — ${verse.book_name} ${verse.chapter}:${verse.verse} (BSB)`,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Sheet Handle */}
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <View style={styles.studyBadge}>
                  <Ionicons name="library" size={12} color="#FF6B35" />
                  <Text style={styles.studyBadgeText}>STUDY ENGINE</Text>
                </View>
                <Text style={styles.verseRef}>
                  {verse.book_name} {verse.chapter}:{verse.verse}
                </Text>
              </View>
              <Text style={styles.verseQuote} numberOfLines={2}>
                "{verse.text}"
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "crossref" && styles.tabBtnActive]}
              onPress={() => setActiveTab("crossref")}
            >
              <Ionicons
                name="git-compare-outline"
                size={15}
                color={activeTab === "crossref" ? "#FF6B35" : colors.muted}
              />
              <Text style={[styles.tabBtnText, activeTab === "crossref" && styles.tabBtnTextActive]}>
                Cross References {crossRefs.length > 0 ? `(${crossRefs.length})` : ""}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "lexicon" && styles.tabBtnActive]}
              onPress={() => setActiveTab("lexicon")}
            >
              <Ionicons
                name="language-outline"
                size={15}
                color={activeTab === "lexicon" ? "#FF6B35" : colors.muted}
              />
              <Text style={[styles.tabBtnText, activeTab === "lexicon" && styles.tabBtnTextActive]}>
                Word Study & Lexicon
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === "crossref" ? (
              <View>
                {loadingRefs ? (
                  <View style={styles.centered}>
                    <ActivityIndicator size="small" color="#FF6B35" />
                    <Text style={styles.loadingText}>Loading scriptural connections...</Text>
                  </View>
                ) : crossRefs.length > 0 ? (
                  crossRefs.map((ref, idx) => (
                    <TouchableOpacity
                      key={`${ref.toBookId}-${ref.toChapter}-${ref.toVerse}-${idx}`}
                      style={styles.refCard}
                      onPress={() => {
                        onClose();
                        onNavigateToPassage(ref.toBookId, ref.toChapter, ref.toVerse);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.refCardHeader}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Text style={styles.targetRefText}>
                            {ref.toBookName} {ref.toChapter}:{ref.toVerse}
                            {ref.toEndVerse ? `-${ref.toEndVerse}` : ""}
                          </Text>
                          {ref.label && (
                            <View style={styles.labelBadge}>
                              <Text style={styles.labelBadgeText}>{ref.label}</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.jumpBtn}>
                          <Text style={styles.jumpBtnText}>Read</Text>
                          <Ionicons name="arrow-forward" size={12} color="#FF6B35" />
                        </View>
                      </View>
                      {ref.previewText && (
                        <Text style={styles.previewVerseText}>"{ref.previewText}"</Text>
                      )}
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyIcon}>🔗</Text>
                    <Text style={styles.emptyTitle}>General Theological Passage</Text>
                    <Text style={styles.emptyDesc}>
                      Explore related keywords using the Word Study tab or Search tab to discover cross-references.
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View>
                <Text style={styles.lexiconSubtitle}>
                  Original Greek & Hebrew Lexical Root Words
                </Text>
                {strongsEntries.map((entry) => (
                  <View key={entry.strongId} style={styles.lexiconCard}>
                    <View style={styles.lexiconHeader}>
                      <View>
                        <Text style={styles.originalScript}>{entry.original}</Text>
                        <Text style={styles.translitText}>
                          {entry.transliteration}{" "}
                          <Text style={styles.pronounceText}>({entry.pronunciation})</Text>
                        </Text>
                      </View>
                      <View style={styles.strongBadge}>
                        <Text style={styles.strongBadgeText}>{entry.strongId}</Text>
                        <Text style={styles.strongLangText}>{entry.language}</Text>
                      </View>
                    </View>

                    <Text style={styles.partOfSpeech}>{entry.partOfSpeech}</Text>
                    <Text style={styles.definitionText}>{entry.definition}</Text>

                    <View style={styles.usageBlock}>
                      <Text style={styles.usageTitle}>Theological Significance:</Text>
                      <Text style={styles.usageNotes}>{entry.usageNotes}</Text>
                    </View>

                    {entry.keyPassages && entry.keyPassages.length > 0 && (
                      <View style={styles.passagesBlock}>
                        <Text style={styles.passagesTitle}>Key Occurrences:</Text>
                        <View style={styles.passagePills}>
                          {entry.keyPassages.map((p) => (
                            <View key={p} style={styles.passagePill}>
                              <Text style={styles.passagePillText}>{p}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "flex-end",
    },
    sheetContainer: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      maxHeight: "85%",
      minHeight: "55%",
      paddingTop: 12,
      borderTopWidth: 1,
      borderColor: c.border,
    },
    handleRow: { alignItems: "center", marginBottom: 12 },
    handle: {
      width: 44,
      height: 5,
      borderRadius: 3,
      backgroundColor: c.border,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingHorizontal: 22,
      marginBottom: 16,
    },
    badgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
    studyBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "#FF6B3518",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    studyBadgeText: {
      fontFamily: "Syne-Bold",
      fontSize: 10,
      color: "#FF6B35",
      letterSpacing: 0.5,
    },
    verseRef: { fontFamily: "Syne-Bold", fontSize: 16, color: c.text },
    verseQuote: {
      fontFamily: "Lora-Regular",
      fontSize: 13,
      color: c.muted,
      fontStyle: "italic",
      lineHeight: 18,
    },
    closeBtn: {
      padding: 6,
      borderRadius: 16,
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
    },

    tabRow: {
      flexDirection: "row",
      paddingHorizontal: 22,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      gap: 12,
    },
    tabBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 10,
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    tabBtnActive: { borderBottomColor: "#FF6B35" },
    tabBtnText: { fontFamily: "DMSans-Medium", fontSize: 13, color: c.muted },
    tabBtnTextActive: { color: "#FF6B35" },

    contentScroll: { flex: 1 },
    contentContainer: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 40 },

    refCard: {
      backgroundColor: c.background,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    refCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },
    targetRefText: { fontFamily: "Syne-Bold", fontSize: 14, color: "#FF6B35" },
    labelBadge: {
      backgroundColor: "#7C3AED18",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    labelBadgeText: { fontFamily: "DMSans-Medium", fontSize: 10, color: "#7C3AED" },
    jumpBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: "#FF6B3518",
    },
    jumpBtnText: { fontFamily: "Syne-Bold", fontSize: 11, color: "#FF6B35" },
    previewVerseText: {
      fontFamily: "Lora-Regular",
      fontSize: 13,
      color: c.text,
      lineHeight: 20,
    },

    lexiconSubtitle: {
      fontFamily: "DMSans-Medium",
      fontSize: 12,
      color: c.muted,
      marginBottom: 12,
    },
    lexiconCard: {
      backgroundColor: c.background,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    lexiconHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 8,
    },
    originalScript: {
      fontFamily: "Syne-Bold",
      fontSize: 22,
      color: "#FF6B35",
      marginBottom: 2,
    },
    translitText: { fontFamily: "DMSans-Medium", fontSize: 13, color: c.text },
    pronounceText: { color: c.muted, fontStyle: "italic", fontSize: 12 },
    strongBadge: {
      alignItems: "flex-end",
      backgroundColor: c.surface,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    strongBadgeText: { fontFamily: "Syne-Bold", fontSize: 12, color: "#7C3AED" },
    strongLangText: { fontFamily: "DMSans-Regular", fontSize: 10, color: c.muted },
    partOfSpeech: {
      fontFamily: "DMSans-Regular",
      fontSize: 11,
      color: "#06D6A0",
      marginBottom: 8,
    },
    definitionText: {
      fontFamily: "Lora-Regular",
      fontSize: 14,
      color: c.text,
      lineHeight: 22,
      marginBottom: 12,
    },
    usageBlock: {
      backgroundColor: c.surface,
      borderRadius: 10,
      padding: 10,
      marginBottom: 10,
    },
    usageTitle: {
      fontFamily: "Syne-Bold",
      fontSize: 11,
      color: "#FF6B35",
      marginBottom: 4,
    },
    usageNotes: {
      fontFamily: "DMSans-Regular",
      fontSize: 12,
      color: c.muted,
      lineHeight: 18,
    },
    passagesBlock: { marginTop: 4 },
    passagesTitle: {
      fontFamily: "DMSans-Medium",
      fontSize: 11,
      color: c.muted,
      marginBottom: 6,
    },
    passagePills: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    passagePill: {
      backgroundColor: c.surface,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    passagePillText: { fontFamily: "DMSans-Medium", fontSize: 11, color: c.text },

    centered: { alignItems: "center", justifyContent: "center", paddingVertical: 40 },
    loadingText: {
      fontFamily: "DMSans-Regular",
      fontSize: 12,
      color: c.muted,
      marginTop: 8,
    },
    emptyCard: {
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      backgroundColor: c.background,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
    },
    emptyIcon: { fontSize: 32, marginBottom: 8 },
    emptyTitle: { fontFamily: "Syne-Bold", fontSize: 14, color: c.text, marginBottom: 4 },
    emptyDesc: {
      fontFamily: "DMSans-Regular",
      fontSize: 12,
      color: c.muted,
      textAlign: "center",
      lineHeight: 18,
    },
  });
}
