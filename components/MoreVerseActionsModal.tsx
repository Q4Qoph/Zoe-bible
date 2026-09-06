import { Ionicons } from "@expo/vector-icons";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppColors } from "../constants/theme";
import { ChapterVerse } from "../src/db/queries";
import { useTheme } from "../src/contexts/ThemeContext";

interface MoreVerseActionsModalProps {
  visible: boolean;
  verse: ChapterVerse | null;
  isHighlighted: boolean;
  onClose: () => void;
  onOpenWordStudy: () => void;
  onOpenCompare: () => void;
  onOpenCardStudio: () => void;
  onCopyVerse: () => void;
  onShareVerse: () => void;
  onClearHighlight: () => void;
}

export default function MoreVerseActionsModal({
  visible,
  verse,
  isHighlighted,
  onClose,
  onOpenWordStudy,
  onOpenCompare,
  onOpenCardStudio,
  onCopyVerse,
  onShareVerse,
  onClearHighlight,
}: MoreVerseActionsModalProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  if (!verse) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheetContainer} onStartShouldSetResponder={() => true}>
          {/* Handle */}
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.verseRef}>
                {verse.book_name} {verse.chapter}:{verse.verse}
              </Text>
              <Text style={styles.verseSnippet} numberOfLines={1}>
                "{verse.text}"
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {/* Actions List */}
          <View style={styles.actionsList}>
            {/* Word Study */}
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                onClose();
                onOpenWordStudy();
              }}
            >
              <View style={[styles.iconBox, { backgroundColor: "#7C3AED18" }]}>
                <Ionicons name="language-outline" size={20} color="#7C3AED" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>Word Study & Lexicon</Text>
                <Text style={styles.actionSubtitle}>Explore original Greek & Hebrew root words</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </TouchableOpacity>

            {/* Compare Translations */}
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                onClose();
                onOpenCompare();
              }}
            >
              <View style={[styles.iconBox, { backgroundColor: "#38BDF818" }]}>
                <Ionicons name="swap-horizontal-outline" size={20} color="#38BDF8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>Compare Translations</Text>
                <Text style={styles.actionSubtitle}>Compare side-by-side in BSB, KJV & WEB</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </TouchableOpacity>

            {/* Verse Card Studio */}
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                onClose();
                onOpenCardStudio();
              }}
            >
              <View style={[styles.iconBox, { backgroundColor: "#F59E0B18" }]}>
                <Ionicons name="sparkles-outline" size={20} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>Create Verse Card</Text>
                <Text style={styles.actionSubtitle}>Design stylized graphic for social sharing</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </TouchableOpacity>

            {/* Copy Verse */}
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                onClose();
                onCopyVerse();
              }}
            >
              <View style={[styles.iconBox, { backgroundColor: "#06D6A018" }]}>
                <Ionicons name="copy-outline" size={20} color="#06D6A0" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>Copy to Clipboard</Text>
                <Text style={styles.actionSubtitle}>Copy verse text with scripture reference</Text>
              </View>
            </TouchableOpacity>

            {/* Share Verse */}
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                onClose();
                onShareVerse();
              }}
            >
              <View style={[styles.iconBox, { backgroundColor: "#FF6B3518" }]}>
                <Ionicons name="share-social-outline" size={20} color="#FF6B35" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>Share Scripture</Text>
                <Text style={styles.actionSubtitle}>Send via WhatsApp, Messages, or Email</Text>
              </View>
            </TouchableOpacity>

            {/* Clear Highlight if highlighted */}
            {isHighlighted && (
              <TouchableOpacity
                style={[styles.actionItem, { borderBottomWidth: 0 }]}
                onPress={() => {
                  onClose();
                  onClearHighlight();
                }}
              >
                <View style={[styles.iconBox, { backgroundColor: "#EF444418" }]}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionTitle, { color: "#EF4444" }]}>Remove Highlight</Text>
                  <Text style={styles.actionSubtitle}>Clear color highlight from this verse</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
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
      paddingTop: 12,
      paddingBottom: 36,
      borderTopWidth: 1,
      borderColor: c.border,
    },
    handleRow: { alignItems: "center", marginBottom: 12 },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 24,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    verseRef: { fontFamily: "Syne-Bold", fontSize: 17, color: c.text },
    verseSnippet: {
      fontFamily: "Lora-Regular",
      fontSize: 12,
      color: c.muted,
      fontStyle: "italic",
      maxWidth: 260,
      marginTop: 2,
    },
    closeBtn: {
      padding: 6,
      borderRadius: 14,
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
    },
    actionsList: { paddingHorizontal: 16, paddingTop: 8 },
    actionItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: c.border + "55",
    },
    iconBox: {
      width: 38,
      height: 38,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    actionTitle: { fontFamily: "DMSans-Medium", fontSize: 14, color: c.text },
    actionSubtitle: { fontFamily: "DMSans-Regular", fontSize: 11, color: c.muted, marginTop: 1 },
  });
}
