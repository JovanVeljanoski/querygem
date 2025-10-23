import React from 'react';
import type { Schema } from '../types';
import { TableIcon } from './icons/TableIcon';

interface SchemaExplorerProps {
  schema: Schema;
}

const NoTablesFoundMessage: React.FC = () => (
  <div className="mt-4 p-3 bg-yellow-900/40 border border-yellow-700 rounded-lg text-yellow-200 text-sm">
    <p className="font-bold mb-2">No tables were found.</p>
    <div className="space-y-2 text-yellow-300/90">
      <p>
        <strong>Common Cause:</strong> If your database uses Write-Ahead Logging (WAL), recent changes (like table creation) might be in a separate <code>.db-wal</code> file.
      </p>
      <p>
        <strong>Solution:</strong> Please ensure any other applications (e.g., a Python script, database browser) connected to this database are <strong>fully closed</strong>. This commits all changes to the main <code>.db</code> file, making them visible here.
      </p>
    </div>
  </div>
);


export const SchemaExplorer: React.FC<SchemaExplorerProps> = ({ schema }) => {
  if (!schema || schema.length === 0) {
    return <NoTablesFoundMessage />;
  }

  return (
    <div className="mt-4 space-y-2">
      {schema.map((table) => (
        <details key={table.name} className="bg-gray-700/50 rounded-lg overflow-hidden" open>
          <summary className="font-bold cursor-pointer p-3 flex items-center hover:bg-gray-700 transition-colors">
            <TableIcon className="w-5 h-5 mr-2 text-cyan-400 flex-shrink-0" />
            <span className="truncate">{table.name}</span>
          </summary>
          <ul className="pl-6 pr-2 py-2 bg-gray-900/50">
            {table.columns.map((column) => (
              <li key={column.name} className="text-sm py-1 flex justify-between items-center text-gray-300">
                <span className="truncate">{column.name}</span>
                <span className="ml-2 text-xs font-mono bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">{column.type}</span>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
};