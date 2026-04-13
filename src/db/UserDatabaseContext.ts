import { SQLiteDatabase } from 'expo-sqlite';
import { createContext, useContext } from 'react';

export const UserDatabaseContext = createContext<SQLiteDatabase | null>(null);

export function useUserDatabase(): SQLiteDatabase {
  const db = useContext(UserDatabaseContext);
  if (!db) throw new Error('UserDatabaseContext not provided');
  return db;
}