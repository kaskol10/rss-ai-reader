import React, { useState, useEffect } from 'react';
import { RSSItem } from '../types';

interface SearchBarProps {
  items: RSSItem[];
  onFilteredItems: (filteredItems: RSSItem[]) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  items,
  onFilteredItems,
  placeholder = "Search articles...",
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!searchTerm.trim()) {
      onFilteredItems(items);
      return;
    }

    const filtered = items.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.title.toLowerCase().includes(searchLower) ||
        (item.contentSnippet && item.contentSnippet.toLowerCase().includes(searchLower)) ||
        (item.sourceFeed && item.sourceFeed.toLowerCase().includes(searchLower)) ||
        (item.shortAiSummary && item.shortAiSummary.toLowerCase().includes(searchLower)) ||
        (item.creator && item.creator.toLowerCase().includes(searchLower))
      );
    });

    onFilteredItems(filtered);
  }, [searchTerm, items, onFilteredItems]);

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 dark:focus:placeholder-gray-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors duration-200"
        />
        {searchTerm && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              onClick={clearSearch}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
      
      {isFocused && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
            Press <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">/</kbd> to focus search
          </div>
        </div>
      )}
    </div>
  );
};
