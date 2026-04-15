import AsyncStorage from "@react-native-async-storage/async-storage";

export async function updateStreak(): Promise<number> {
  const today = new Date().toISOString().split("T")[0];
  const lastDate = await AsyncStorage.getItem("streak_last_date");
  const count = parseInt((await AsyncStorage.getItem("streak_count")) ?? "0");

  if (lastDate === today) return count; // already counted today

  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const newCount = lastDate === yesterday ? count + 1 : 1;

  await AsyncStorage.setItem("streak_count", newCount.toString());
  await AsyncStorage.setItem("streak_last_date", today);
  return newCount;
}

export async function getStreak(): Promise<number> {
  const val = await AsyncStorage.getItem("streak_count");
  return val ? parseInt(val) : 0;
}
