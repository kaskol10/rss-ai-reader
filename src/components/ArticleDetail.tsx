import React, { useState, useEffect } from 'react';
import { RSSItem, AIPrompt } from '../types';
import { ExternalLink, Bot, Loader2, Star } from 'lucide-react';
import { sanitizeHTML } from '../utils/htmlSanitizer';
import { fetchPreviewContent, PreviewContent } from '../services/previewService';

interface ArticleDetailProps {
  item: RSSItem;
  onGenerateSummary: () => void;
  generatingSummary: boolean;
  currentPrompt: AIPrompt;
  onToggleFavorite: (item: RSSItem) => void;
}

const ArticleDetail: React.FC<ArticleDetailProps> = ({
  item,
  onGenerateSummary,
  generatingSummary,
  currentPrompt,
  onToggleFavorite
}) => {
  const [previewContent, setPreviewContent] = useState<PreviewContent | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  };

  // Auto-load preview content for Hacker News articles (non-blocking)
  useEffect(() => {
    if (item.sourceFeed === 'Hacker News' && item.link && !item.link.includes('news.ycombinator.com')) {
      // Load preview in background without blocking UI
      setLoadingPreview(true);
      setPreviewError(null);
      
      // Use setTimeout to make it non-blocking
      setTimeout(() => {
        fetchPreviewContent(item.link)
          .then(data => {
            setPreviewContent(data);
            setLoadingPreview(false);
          })
          .catch(err => {
            console.error('Error fetching preview:', err);
            setPreviewError('Failed to load article preview');
            setLoadingPreview(false);
          });
      }, 100); // Small delay to not block UI
    } else {
      setPreviewContent(null);
      setPreviewError(null);
      setLoadingPreview(false);
    }
  }, [item.link, item.sourceFeed]);

  return (
    <div className="bg-white min-h-screen">
      <div className="px-4 py-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 leading-tight mb-4">
            {item.title}
          </h2>
          
          <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
            <div className="flex items-center space-x-2">
              <span>{formatDate(item.pubDate)}</span>
              <span>•</span>
              <span>{getDomain(item.link)}</span>
            </div>
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
            >
              <span>Open</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>

        {item.contentSnippet && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Summary</h3>
            <div
              className="text-sm text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: sanitizeHTML(item.contentSnippet) }}
            />
          </div>
        )}

        {/* Article Preview for Hacker News */}
        {item.sourceFeed === 'Hacker News' && item.link && !item.link.includes('news.ycombinator.com') && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <ExternalLink className="w-4 h-4" />
              <span>Article Preview</span>
            </h3>
            
            {loadingPreview && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="ml-2 text-sm meta">Loading article preview...</span>
              </div>
            )}

            {previewError && (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="text-sm text-red-600 mb-2">{previewError}</p>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline"
                >
                  Open article directly
                </a>
              </div>
            )}

            {previewContent && !loadingPreview && !previewError && (
              <div className="bg-hover rounded-lg p-4 space-y-4">
                {/* Article Image */}
                {previewContent.image && (
                  <div className="relative">
                    <img
                      src={previewContent.image}
                      alt={previewContent.title}
                      className="w-full h-48 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Article Title */}
                <div>
                  <h4 className="text-lg font-semibold text-primary leading-tight mb-2">
                    {previewContent.title}
                  </h4>
                  <div className="flex items-center space-x-2 text-sm meta">
                    <span>{previewContent.domain}</span>
                    <span>•</span>
                    <a
                      href={previewContent.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline flex items-center space-x-1"
                    >
                      <span>Read full article</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Article Description */}
                <div>
                  <p className="text-sm text-text leading-relaxed">
                    {previewContent.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Short AI Summary */}
        {item.shortAiSummary && (
          <div className="border-t border-border pt-4">
            <div className="flex items-center space-x-2 mb-3">
              <Bot className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-medium text-primary">Quick AI Summary</h3>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <p className="text-sm text-blue-800 font-medium">
                {item.shortAiSummary}
              </p>
            </div>
          </div>
        )}

        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-primary flex items-center space-x-2">
              <Bot className="w-4 h-4 text-primary" />
              <span>Extended AI Summary</span>
            </h3>
            <span className="text-xs meta">
              {currentPrompt.name}
            </span>
          </div>

          {item.aiSummary ? (
            <div className="bg-hover rounded p-4">
              <div 
                className="text-sm text-text leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHTML(item.aiSummary) }}
              />
            </div>
          ) : (
            <div className="text-center py-6">
              <button
                onClick={onGenerateSummary}
                disabled={generatingSummary}
                className="inline-flex items-center space-x-2 btn-primary disabled:opacity-50"
              >
                {generatingSummary ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
                <span>
                  {generatingSummary ? 'Generating Extended Summary...' : 'Generate Extended AI Summary'}
                </span>
              </button>
              <p className="text-xs meta mt-2">
                This will fetch and analyze the full article content
              </p>
              <p className="text-xs meta">
                Using prompt: {currentPrompt.name}
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default ArticleDetail;
