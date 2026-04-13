import { SQLiteDatabase } from 'expo-sqlite';
import { createContext, useContext } from 'react';

export const DatabaseContext = createContext<SQLiteDatabase | null>(null);

export function useDatabase(): SQLiteDatabase {
  const db = useContext(DatabaseContext);
  if (!db) throw new Error('DatabaseContext not provided');
  return db;
}