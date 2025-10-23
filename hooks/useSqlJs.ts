import { useState, useEffect, useCallback } from 'react';
import type { Database, SqlJsStatic } from 'sql.js';
import type { SqlJsHook, Schema, Table, Column, QueryResult } from '../types';

declare global {
  interface Window {
    initSqlJs: (config?: object) => Promise<SqlJsStatic>;
  }
}

export const useSqlJs = (): SqlJsHook => {
  const [SQL, setSQL] = useState<SqlJsStatic | null>(null);
  const [db, setDb] = useState<Database | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDbLoading, setIsDbLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!window.initSqlJs) {
        setError("sql.js not loaded. Ensure the script is included in your HTML.");
        return;
    }
    window.initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
    })
    .then(setSQL)
    .catch((e: Error) => setError(`Failed to initialize sql.js: ${e.message}`));
  }, []);

  const loadDatabase = useCallback(async (file: File) => {
    if (!SQL) {
      setError("sql.js is not initialized yet.");
      return;
    }
    
    setIsDbLoading(true);
    setError(null);

    try {
      const fileBuffer = await file.arrayBuffer();
      const newDb = new SQL.Database(new Uint8Array(fileBuffer));
      setDb(newDb);
    } catch (e) {
      setError(e instanceof Error ? `Error loading database: ${e.message}` : String(e));
      setDb(null);
    } finally {
      setIsDbLoading(false);
    }
  }, [SQL]);

  const closeDatabase = useCallback(() => {
    if (db) {
      // Per sql.js docs, this releases the memory used by the database.
      db.close();
      setDb(null);
    }
  }, [db]);

  const execQuery = useCallback((query: string): QueryResult | null => {
    if (!db) {
      throw new Error("Database not loaded.");
    }
    try {
      const results = db.exec(query);
      return results;
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : String(e));
    }
  }, [db]);
  
  const getSchema = useCallback((): Schema => {
    if (!db) {
      return [];
    }

    try {
        const tablesResult = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");

        if (!tablesResult || tablesResult.length === 0) {
            return [];
        }

        const tables: Table[] = tablesResult[0].values.map((row: any) => {
            const tableName = row[0] as string;
            const columns: Column[] = [];
            
            const tableInfoResult = db.exec(`PRAGMA table_info(\`${tableName}\`);`);

            if (tableInfoResult && tableInfoResult.length > 0) {
                tableInfoResult[0].values.forEach((col: any) => {
                    columns.push({
                        name: col[1] as string,
                        type: col[2] as string
                    });
                });
            }
            
            return {
                name: tableName,
                columns: columns
            };
        });
        
        return tables;
    } catch (e) {
        setError(`Failed to retrieve schema: ${e instanceof Error ? e.message : String(e)}`);
        return [];
    }
  }, [db]);

  return { db, error, isDbLoading, loadDatabase, closeDatabase, execQuery, getSchema };
};