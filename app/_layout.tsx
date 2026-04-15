import {
  DMSans_400Regular,
  DMSans_500Medium,
} from "@expo-google-fonts/dm-sans";
import { Lora_400Regular, Lora_700Bold } from "@expo-google-fonts/lora";
import { Syne_700Bold, useFonts } from "@expo-google-fonts/syne";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SQLiteDatabase } from "expo-sqlite";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DatabaseContext } from "../src/db";
import { ThemeProvider } from "../src/contexts/ThemeContext";
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
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

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
    Promise.all([
      openDatabase(),
      openUserDatabase(),
      AsyncStorage.getItem("onboarded"),
    ])
      .then(([bibleDb, uDb, onboarded]) => {
        setDb(bibleDb);
        setUserDb(uDb);
        setOnboarded(onboarded === "true");
      })
      .catch((e) => setDbError(e.message));
  }, []);

  useEffect(() => {
    if (fontsLoaded && db && userDb && onboarded !== null)
      SplashScreen.hideAsync();
  }, [fontsLoaded, db, userDb, onboarded]);

  if (!fontsLoaded || !db || !userDb || onboarded === null) {
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
      <ThemeProvider>
        <DatabaseContext.Provider value={db}>
          <UserDatabaseContext.Provider value={userDb}>
            <Stack>
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="reader" options={{ headerShown: false }} />
              <Stack.Screen name="plan" options={{ headerShown: false }} />
              <Stack.Screen name="settings" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: "modal" }} />
            </Stack>
          </UserDatabaseContext.Provider>
        </DatabaseContext.Provider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
