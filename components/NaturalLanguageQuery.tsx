import React, { useState } from 'react';

interface NaturalLanguageQueryProps {
  onQuery: (query: string) => void;
  isLoading: boolean;
  disabled: boolean;
  hasApiKey: boolean;
}

export const NaturalLanguageQuery: React.FC<NaturalLanguageQueryProps> = ({ onQuery, isLoading, disabled, hasApiKey }) => {
  const [naturalQuery, setNaturalQuery] = useState('');

  const handleAsk = () => {
    if (naturalQuery.trim()) {
      onQuery(naturalQuery);
    }
  };
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter, but allow Shift+Enter for new lines
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleAsk();
    }
  }
  
  const isFeatureDisabled = disabled || isLoading || !hasApiKey;

  return (
    <div className="flex flex-col space-y-2">
      <label htmlFor="nl-query" className="text-lg font-semibold text-gray-300">Ask with AI</label>
      <textarea
        id="nl-query"
        value={naturalQuery}
        onChange={(e) => setNaturalQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          !hasApiKey 
            ? "AI features disabled. Please provide an API_KEY." 
            : "e.g., show me all users with gmail accounts"
        }
        disabled={isFeatureDisabled}
        rows={1}
        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition disabled:bg-gray-700/50 disabled:cursor-not-allowed resize-y min-h-[46px]"
      />
      <button
        onClick={handleAsk}
        disabled={isFeatureDisabled || !naturalQuery.trim()}
        className="self-end bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-lg transition duration-200 ease-in-out flex items-center"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Thinking...
          </>
        ) : (
          'Ask AI'
        )}
      </button>
    </div>
  );
};