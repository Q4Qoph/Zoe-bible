import {
  DMSans_400Regular,
  DMSans_500Medium,
} from "@expo-google-fonts/dm-sans";
import { Lora_400Regular, Lora_700Bold } from "@expo-google-fonts/lora";
import { Syne_700Bold, useFonts } from "@expo-google-fonts/syne";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SQLiteDatabase } from "expo-sqlite";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DatabaseContext } from "../src/db";
import { openDatabase } from "../src/db/database";
import { UserDatabaseContext } from "../src/db/UserDatabaseContext";
import { openUserDatabase } from "../src/db/userDb";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = { initialRouteName: "(tabs)" };

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [userDb, setUserDb] = useState<SQLiteDatabase | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  const [fontsLoaded, fontError] = useFonts({
    "Syne-Bold": Syne_700Bold,
    "Lora-Regular": Lora_400Regular,
    "Lora-Bold": Lora_700Bold,
    "DMSans-Regular": DMSans_400Regular,
    "DMSans-Medium": DMSans_500Medium,
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    Promise.all([openDatabase(), openUserDatabase()])
      .then(([bibleDb, uDb]) => {
        setDb(bibleDb);
        setUserDb(uDb);
      })
      .catch((e) => setDbError(e.message));
  }, []);

  useEffect(() => {
    if (fontsLoaded && db && userDb) SplashScreen.hideAsync();
  }, [fontsLoaded, db, userDb]);

  if (!fontsLoaded || !db || !userDb) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0F0F14",
        }}
      >
        <Text style={{ color: "#FF6B35", fontSize: 28, fontWeight: "bold" }}>
          Zoe
        </Text>
        <Text style={{ color: "#6B6B80", marginTop: 8, fontSize: 13 }}>
          {dbError ? `Error: ${dbError}` : "Loading scripture..."}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <DatabaseContext.Provider value={db}>
        <UserDatabaseContext.Provider value={userDb}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: "modal" }} />
          </Stack>
        </UserDatabaseContext.Provider>
      </DatabaseContext.Provider>
    </SafeAreaProvider>
  );
}
