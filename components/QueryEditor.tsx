import React from 'react';

interface QueryEditorProps {
  query: string;
  onQueryChange: (query: string) => void;
  onRun: (query: string) => void;
  isLoading: boolean;
  disabled: boolean;
}

export const QueryEditor: React.FC<QueryEditorProps> = ({ query, onQueryChange, onRun, isLoading, disabled }) => {
  const handleRunClick = () => {
    onRun(query);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault(); // Prevent adding a new line
      onRun(query);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <label htmlFor="sql-editor" className="text-lg font-semibold text-gray-300">SQL Editor</label>
      <textarea
        id="sql-editor"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="SELECT * FROM my_table;"
        disabled={disabled}
        className="w-full h-32 p-3 font-mono text-sm bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition disabled:bg-gray-700/50 disabled:cursor-not-allowed"
      />
       <div className="flex justify-between items-center">
        <p className="text-xs text-gray-500">
            Tip: Press <kbd className="font-sans px-1.5 py-0.5 border border-gray-600 rounded-md bg-gray-700">Cmd</kbd> + <kbd className="font-sans px-1.5 py-0.5 border border-gray-600 rounded-md bg-gray-700">Enter</kbd> to run.
        </p>
        <button
            onClick={handleRunClick}
            disabled={disabled || isLoading}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-lg transition duration-200 ease-in-out"
        >
            {isLoading ? 'Running...' : 'Run Query'}
        </button>
      </div>
    </div>
  );
};