import React, { useState, useCallback, useEffect } from 'react';
import { useSqlJs } from './hooks/useSqlJs';
import type { Schema, QueryResult } from './types';
import { generateSqlFromNaturalLanguage } from './services/geminiService';

import { FileLoader } from './components/FileLoader';
import { SchemaExplorer } from './components/SchemaExplorer';
import { QueryEditor } from './components/QueryEditor';
import { NaturalLanguageQuery } from './components/NaturalLanguageQuery';
import { ResultsTable } from './components/ResultsTable';
import { Spinner } from './components/Spinner';
import { DatabaseIcon } from './components/icons/DatabaseIcon';
import { DisconnectIcon } from './components/icons/DisconnectIcon';
import { XIcon } from './components/icons/XIcon';

const hasApiKey = !!process.env.GEMINI_API_KEY;

export default function App() {
  const { db, error: dbError, isDbLoading, loadDatabase, closeDatabase, execQuery, getSchema } = useSqlJs();
  const [schema, setSchema] = useState<Schema | null>(null);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM your_table_name LIMIT 10;');
  const [error, setError] = useState<string | null>(null);
  const [isQueryLoading, setIsQueryLoading] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dbFileName, setDbFileName] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const handleFileChange = async (file: File) => {
    // Reset entire state before loading a new file
    setIsConnected(false);
    setDbFileName(null);
    setSchema(null);
    setQueryResult(null);
    setError(null);
    setSqlQuery('SELECT * FROM your_table_name LIMIT 10;');

    setIsQueryLoading(true);
    try {
      await loadDatabase(file);
      setDbFileName(file.name);
      setIsConnected(true); // Connection is now live
      setIsSidebarOpen(true);
    } catch (e) {
      setError(`Failed to load database: ${e instanceof Error ? e.message : String(e)}`);
      setDbFileName(null);
      setIsConnected(false);
    } finally {
      setIsQueryLoading(false);
    }
  };

  const handleCloseConnection = () => {
    if (window.confirm("Are you sure you want to close the connection to this database?")) {
        // This is the fix: Perform a full, immediate, atomic reset of the app state.
        closeDatabase();
        setIsConnected(false);
        setDbFileName(null);
        setSchema(null);
        setQueryResult(null);
        setError(null);
        setSqlQuery('SELECT * FROM your_table_name LIMIT 10;');
        setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    // This effect now ONLY handles what to do AFTER a database is successfully loaded.
    // The disconnect state is handled imperatively by handleCloseConnection.
    if (db && isConnected) {
      try {
        const dbSchema = getSchema();
        setSchema(dbSchema);
        if (dbSchema.length > 0) {
          setError(null); // Clear any previous errors (like the WAL warning)
          setSqlQuery(`SELECT * FROM ${dbSchema[0].name} LIMIT 10;`);
        } else {
          setError(`Database loaded, but no tables were found.\n\nThis is a common issue with SQLite's Write-Ahead Logging (WAL) mode. If another application (like a Python script or database browser) has the database open, recent changes might not be in the main .db file yet.\n\nSolution: Please ensure all other programs connected to this database are fully closed. This will commit all changes, making the tables visible here.`);
          setSqlQuery('// No tables found. Please see the message in the results panel.');
        }
      } catch (e) {
        setError(`Failed to read schema: ${e instanceof Error ? e.message : String(e)}`);
        setSchema(null);
      }
    }
  }, [db, isConnected, getSchema]);


  const handleRunQuery = useCallback((query: string) => {
    if (!isConnected || !db) {
      setError("No database loaded.");
      return;
    }
    setIsQueryLoading(true);
    setError(null);
    setQueryResult(null);

    setTimeout(() => {
        try {
            const result = execQuery(query);
            setQueryResult(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
            setQueryResult(null);
        } finally {
            setIsQueryLoading(false);
        }
    }, 10);
  }, [isConnected, db, execQuery]);

  const handleAskAI = useCallback(async (naturalQuery: string) => {
    if (!isConnected || !schema || schema.length === 0) {
      setError("Cannot generate SQL without a database schema. Please load a valid database first.");
      return;
    }
    setIsAiLoading(true);
    setError(null);
    try {
      const generatedSql = await generateSqlFromNaturalLanguage(schema, naturalQuery);
      setSqlQuery(generatedSql);
      handleRunQuery(generatedSql);
    } catch (e) {
      setError(`AI query failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsAiLoading(false);
    }
  }, [isConnected, schema, handleRunQuery]);

  return (
    <div className="relative min-h-screen md:flex bg-gray-900 text-gray-100 font-sans">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      <aside
        id="schema-sidebar"
        className={`w-full max-w-xs h-full bg-gray-800 p-4 overflow-y-auto shadow-lg border-r border-gray-700 fixed md:relative z-30 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-cyan-400 flex items-center">
                <DatabaseIcon className="w-6 h-6 mr-2" />
                Schema Explorer
            </h2>
            <button
              className="md:hidden p-1 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close schema explorer"
            >
                <XIcon className="w-6 h-6" />
            </button>
        </div>

        <FileLoader onFileSelect={handleFileChange} disabled={isDbLoading} />
        {isDbLoading && <div className="flex items-center justify-center mt-4"><Spinner /> <span className="ml-2">Loading DB...</span></div>}
        {dbError && <div className="text-red-400 mt-2 bg-red-900/50 p-2 rounded">{dbError}</div>}

        {isConnected && dbFileName && (
          <div className="mt-4 p-3 bg-gray-700/50 rounded-lg space-y-3">
              <div className="text-sm">
                  <span className="font-semibold text-gray-300">Connected to:</span>
                  <p className="font-mono text-cyan-300 break-all">{dbFileName}</p>
              </div>
              <button
                onClick={handleCloseConnection}
                className="w-full flex items-center justify-center bg-red-700 hover:bg-red-800 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 ease-in-out text-sm"
              >
                <DisconnectIcon className="w-4 h-4 mr-2" />
                Disconnect
              </button>
          </div>
        )}

        {isConnected && schema && <SchemaExplorer schema={schema} />}
      </aside>

      <main className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="flex items-center">
          <button
            className="md:hidden mr-4 p-2 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open schema explorer"
            aria-controls="schema-sidebar"
          >
            <DatabaseIcon className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
            QueryGem
          </h1>
        </div>

        <div className="mt-4 space-y-6 flex-grow flex flex-col min-h-0">
          <NaturalLanguageQuery
            onQuery={handleAskAI}
            isLoading={isAiLoading}
            disabled={!isConnected || isAiLoading}
            hasApiKey={hasApiKey}
          />

          <QueryEditor
            query={sqlQuery}
            onQueryChange={setSqlQuery}
            onRun={handleRunQuery}
            isLoading={isQueryLoading}
            disabled={!isConnected || isQueryLoading}
          />

          <div className="flex-grow overflow-auto bg-gray-800 rounded-lg shadow-inner p-4 min-h-0">
              <h3 className="text-lg font-semibold mb-2 text-cyan-400">Results</h3>
              {isQueryLoading && <div className="flex items-center justify-center h-full"><Spinner /> <span className="ml-2">Running query...</span></div>}
              {error && <div className="text-red-300 bg-red-900/50 p-4 rounded h-full overflow-auto" style={{ whiteSpace: 'pre-wrap' }}>{error}</div>}
              {!error && queryResult && <ResultsTable results={queryResult} />}
              {!isQueryLoading && !error && !queryResult && <div className="text-gray-500">No results to display. Run a query to see the output.</div>}
          </div>
        </div>
      </main>
    </div>
  );
}