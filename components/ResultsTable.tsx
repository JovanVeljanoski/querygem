
import React from 'react';
import type { QueryResult } from '../types';

interface ResultsTableProps {
  results: QueryResult;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  if (!results || results.length === 0) {
    return <div className="text-gray-400">Query executed successfully, but returned no results.</div>;
  }

  const { columns, values } = results[0];

  return (
    <div className="w-full h-full overflow-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-800 sticky top-0">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-gray-900 divide-y divide-gray-700">
          {values.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-800/50">
              {row.map((value, cellIndex) => (
                <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {value === null ? <em className="text-gray-500">NULL</em> : String(value)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
