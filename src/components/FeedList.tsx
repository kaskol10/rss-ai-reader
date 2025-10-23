import React from 'react';
import { RSSItem } from '../types';
import { sanitizeHTML } from '../utils/htmlSanitizer';
import { SummaryButton } from './SummaryButton';

interface FeedListProps {
  items: RSSItem[];
  onItemSelect: (item: RSSItem) => void;
  selectedItem: RSSItem | null;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onToggleFavorite: (item: RSSItem) => void;
  onSummaryGenerated: (updatedItem: RSSItem) => void;
  onSummaryError?: (error: string) => void;
  summaryPrompt: string;
}

const FeedList: React.FC<FeedListProps> = ({ 
  items, 
  onItemSelect, 
  currentPage, 
  itemsPerPage, 
  onPageChange, 
  onToggleFavorite, 
  onSummaryGenerated,
  onSummaryError,
  summaryPrompt 
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);

  return (
    <div className="divide-y divide-gray-200">
      {currentItems.map((item, index) => (
        <div
          key={`${item.guid || 'no-guid'}-${item.link || 'no-link'}-${startIndex + index}`}
          className="px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          onClick={() => onItemSelect(item)}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <h3 className="text-base font-medium text-gray-900 leading-tight flex-1 min-w-0 pr-2">
                  {item.title}
                </h3>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {item.aiSummary && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(item);
                    }}
                    className="p-1"
                  >
                    <svg className={`w-5 h-5 ${item.isFavorite ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>{formatDate(item.pubDate)}</span>
                  <span>•</span>
                  <span>{getDomain(item.link)}</span>
                </div>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
              
              {item.shortAiSummary ? (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {item.shortAiSummary}
                    </p>
                  </div>
                </div>
              ) : !item.shortAiSummary ? (
                <div className="mt-2">
                  <SummaryButton
                    item={item}
                    prompt={summaryPrompt}
                    onSummaryGenerated={onSummaryGenerated}
                    onError={onSummaryError}
                  />
                </div>
              ) : item.contentSnippet ? (
                <div 
                  className="text-xs meta mt-1 line-clamp-2 prose prose-xs max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeHTML(item.contentSnippet) }}
                />
              ) : null}
            </div>
          </div>
        </div>
      ))}
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="bg-white border-t border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {startIndex + 1}-{Math.min(endIndex, items.length)} of {items.length}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage <= 2) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 1) {
                    pageNum = totalPages - 2 + i;
                  } else {
                    pageNum = currentPage - 1 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={`px-3 py-1 text-sm rounded ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FeedList;
