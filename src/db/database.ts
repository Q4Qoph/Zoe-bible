import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'BSB.db';

export async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  const dbDir = `${FileSystem.documentDirectory}SQLite/`;
  const dbPath = `${dbDir}${DB_NAME}`;

  // Ensure SQLite directory exists
  const dirInfo = await FileSystem.getInfoAsync(dbDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
  }

  // Copy DB from assets if not already there
  const dbInfo = await FileSystem.getInfoAsync(dbPath);
  if (!dbInfo.exists) {
    const asset = Asset.fromModule(require('../../assets/BSB.db'));
    await asset.downloadAsync();
    await FileSystem.copyAsync({
      from: asset.localUri!,
      to: dbPath,
    });
  }

  const db = await SQLite.openDatabaseAsync(DB_NAME);
  return db;
}