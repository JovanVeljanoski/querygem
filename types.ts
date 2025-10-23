import type { Database, QueryExecResult } from 'sql.js';

export interface Column {
  name: string;
  type: string;
}

export interface Table {
  name: string;
  columns: Column[];
}

export type Schema = Table[];

export type QueryResult = QueryExecResult[];

export interface SqlJsHook {
  db: Database | null;
  error: string | null;
  isDbLoading: boolean;
  loadDatabase: (file: File) => Promise<void>;
  closeDatabase: () => void;
  execQuery: (query: string) => QueryResult | null;
  getSchema: () => Schema;
}