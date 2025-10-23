import React, { useState } from 'react';
import { RSSItem } from '../types';
import { summaryService } from '../services/summaryService';

interface SummaryButtonProps {
  item: RSSItem;
  prompt: string;
  onSummaryGenerated: (updatedItem: RSSItem) => void;
  onError?: (error: string) => void;
  className?: string;
}

export const SummaryButton: React.FC<SummaryButtonProps> = ({
  item,
  prompt,
  onSummaryGenerated,
  onError,
  className = ''
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const itemId = item.guid || item.link;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isGenerating || summaryService.isGenerating(itemId)) {
      return;
    }

    setIsGenerating(true);
    
    try {
      const result = await summaryService.generateSummaryForItem(item, prompt);
      
      if (result.success) {
        onSummaryGenerated(result.item);
      } else {
        onError?.(result.error || 'Failed to generate summary');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onError?.(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const isCurrentlyGenerating = isGenerating || summaryService.isGenerating(itemId);

  return (
    <button
      onClick={handleClick}
      disabled={isCurrentlyGenerating}
      className={`
        inline-flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-md
        transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1
        ${isCurrentlyGenerating 
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
          : 'bg-blue-50 text-blue-700 hover:bg-blue-100 focus:ring-blue-500'
        }
        ${className}
      `}
      aria-label={isCurrentlyGenerating ? 'Generating summary...' : 'Generate AI summary'}
    >
      {isCurrentlyGenerating ? (
        <>
          <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Generating...</span>
        </>
      ) : (
        <>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span>Generate Summary</span>
        </>
      )}
    </button>
  );
};
