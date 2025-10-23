import { useState, useEffect } from 'react';
import { RSSItem, RSSFeed, AIPrompt, FeedSource } from './types';
import { fetchRSSFeed, fetchAllFeeds } from './services/rssService';
import { generateSummary, defaultPrompts } from './services/aiService';
import { fetchArticleContent } from './services/articleService';
import { storageService } from './services/storageService';
import { appStateCache } from './services/smartCache';
import Header from './components/Header';
import FeedList from './components/FeedList';
import ArticleDetail from './components/ArticleDetail';
import PromptSelector from './components/PromptSelector';
import FeedSelector from './components/FeedSelector';
import PrivacyNotice from './components/PrivacyNotice';
import PrivacySettings from './components/PrivacySettings';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SkeletonFeedList } from './components/Skeleton';
import { SearchBar } from './components/SearchBar';
import { ThemeToggle } from './components/ThemeToggle';
import { useRSSReaderShortcuts } from './hooks/useKeyboardShortcuts';

const HACKER_NEWS_RSS_URL = 'https://news.ycombinator.com/rss';

// Default feeds
const defaultFeeds: FeedSource[] = [
  {
    id: 'saved',
    name: 'Saved Articles',
    url: 'saved',
    isDefault: true
  },
  {
    id: 'all-feeds',
    name: 'All Feeds',
    url: 'all-feeds',
    isDefault: true
  },
  {
    id: 'hackernews',
    name: 'Hacker News',
    url: HACKER_NEWS_RSS_URL,
    isDefault: true
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes Blog',
    url: 'https://kubernetes.io/feed.xml',
    isDefault: true
  },
  {
    id: 'github-blog',
    name: 'GitHub Blog',
    url: 'https://github.blog/feed/',
    isDefault: true
  }
];

const AppContent: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [feeds, setFeeds] = useState<FeedSource[]>([]);
  const [currentFeed, setCurrentFeed] = useState<FeedSource | null>(null);
  const [feed, setFeed] = useState<RSSFeed | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<RSSItem | null>(null);
  const [aiPrompts, setAiPrompts] = useState<AIPrompt[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState<AIPrompt | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<{ current: number; total: number } | null>(null);
  // Removed generatingShortSummaries - now handled by SummaryButton component
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [shortSummaryPrompt, setShortSummaryPrompt] = useState<string>('Summarize this article in exactly 20 words or less. Focus on the main point and key takeaway. Be concise and informative.');
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [filteredItems, setFilteredItems] = useState<RSSItem[]>([]);
  // Removed searchFocused - not used in current implementation

  // Initialize app with data from localStorage
  useEffect(() => {
    console.log('App mounted, initializing...');
    
    // Load feeds from localStorage
    const loadedFeeds = storageService.loadFeeds(defaultFeeds);
    setFeeds(loadedFeeds);
    
    // Load AI prompts from localStorage
    const loadedPrompts = storageService.loadPrompts(defaultPrompts);
    setAiPrompts(loadedPrompts);
    setCurrentPrompt(loadedPrompts[0]);
    
    // Load short summary prompt from localStorage
    const savedShortPrompt = localStorage.getItem('rss-ai-short-summary-prompt');
    if (savedShortPrompt) {
      setShortSummaryPrompt(savedShortPrompt);
    }
    
    // Load favorites from localStorage
    const loadedFavorites = storageService.loadFavorites();
    setFavoriteIds(loadedFavorites);
    
    // Load current feed ID and set current feed
    const savedCurrentFeedId = storageService.loadCurrentFeedId();
    const feedToLoad = savedCurrentFeedId 
      ? loadedFeeds.find(f => f.id === savedCurrentFeedId) || loadedFeeds[0]
      : loadedFeeds[0];
    
    setCurrentFeed(feedToLoad);
    
    // Load cached app state info (for debugging/logging)
    const cachedState = appStateCache.get('app-state');
    if (cachedState) {
      console.log('App: Found cached app state:', cachedState);
    }
    
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized && currentFeed) {
      // Only load feed if we don't have cached data for this feed
      const cachedState = appStateCache.get('app-state');
      if (!cachedState || cachedState.currentFeedId !== currentFeed.id) {
        console.log('Loading feed:', currentFeed.name);
        loadFeed(currentFeed);
      } else {
        console.log('Using cached feed data for:', currentFeed.name);
      }
    }
  }, [currentFeed, isInitialized]);

  // Keyboard shortcuts
  useRSSReaderShortcuts({
    onRefresh: () => currentFeed && loadFeed(currentFeed, true),
    onNextItem: () => {
      if (feed && selectedItem) {
        const currentIndex = feed.items.findIndex(item => item.guid === selectedItem.guid);
        if (currentIndex < feed.items.length - 1) {
          handleItemSelect(feed.items[currentIndex + 1]);
        }
      }
    },
    onPrevItem: () => {
      if (feed && selectedItem) {
        const currentIndex = feed.items.findIndex(item => item.guid === selectedItem.guid);
        if (currentIndex > 0) {
          handleItemSelect(feed.items[currentIndex - 1]);
        }
      }
    },
    onToggleFavorite: () => selectedItem && handleToggleFavorite(selectedItem),
    onSearch: () => {
      // Focus search input when / is pressed
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    },
  });

  // Update filtered items when feed changes
  useEffect(() => {
    if (feed) {
      setFilteredItems(feed.items);
    }
  }, [feed]);

  const loadFeed = async (feedSource: FeedSource, bypassCache: boolean = false) => {
    console.log('Starting to load feed:', feedSource.name);
    // Only set loading if not already loading (to avoid flickering)
    if (!loading) {
      setLoading(true);
    }
    setError(null);
    setSelectedItem(null); // Clear selected item when switching feeds
    setLoadingProgress(null);
    
    try {
      let feedData;
      
      if (feedSource.id === 'saved') {
        // Load saved articles from localStorage
        console.log('Loading saved articles...');
        console.log('favoriteIds count:', favoriteIds.size);
        console.log('favoriteIds:', Array.from(favoriteIds));
        
        // Get all saved articles from localStorage instead of relying on state
        const allSavedArticles = storageService.loadAllSavedArticles();
        console.log('All saved articles from storage:', allSavedArticles.length);
        console.log('Sample saved article:', allSavedArticles[0]);
        
        // If no favorite IDs, show all saved articles (for debugging)
        let savedItems;
        if (favoriteIds.size === 0) {
          console.log('No favorite IDs found, showing all saved articles');
          savedItems = allSavedArticles;
        } else {
          savedItems = allSavedArticles.filter(item => {
            const itemId = item.guid || item.link;
            const isFavorite = favoriteIds.has(itemId);
            console.log(`Checking item "${item.title}": ID="${itemId}", isFavorite=${isFavorite}`);
            return isFavorite;
          });
        }
        
        console.log('Filtered saved items:', savedItems.length);
        
        feedData = {
          title: 'Saved Articles',
          description: `Your saved articles (${savedItems.length})`,
          link: '',
          items: savedItems,
          lastBuildDate: new Date().toISOString()
        };
      } else if (feedSource.id === 'all-feeds') {
        // Load all feeds and combine them
        console.log('Loading all feeds...');
        const allFeedUrls = feeds
          .filter(f => f.id !== 'all-feeds' && f.url !== 'all-feeds')
          .map(f => f.url);
        
        if (allFeedUrls.length === 0) {
          throw new Error('No feeds available to load');
        }
        
        setLoadingProgress({ current: 0, total: allFeedUrls.length });
        feedData = await fetchAllFeeds(allFeedUrls, 10000, !bypassCache); // 10 second timeout for faster loading
      } else {
        // Load single feed
        console.log('Fetching RSS feed from:', feedSource.url);
        
        // Set loading progress for single feed
        setLoadingProgress({ current: 1, total: 1 });
        
        // Add timeout for single feeds to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Feed loading timed out')), 8000)
        );
        
        feedData = await Promise.race([
          fetchRSSFeed(feedSource.url, !bypassCache),
          timeoutPromise
        ]);
      }
      
        console.log('Feed loaded successfully:', feedData);
        
        // Mark items as favorites and update saved articles
        const itemsWithFavorites = feedData.items.map((item: RSSItem) => ({
          ...item,
          isFavorite: favoriteIds.has(item.guid || item.link)
        }));
        
        
        const updatedFeedData = { ...feedData, items: itemsWithFavorites };
        console.log('Setting feed data for:', feedSource.name, 'with', itemsWithFavorites.length, 'items');
        setFeed(updatedFeedData);
        showSuccess('Feed loaded!', `Loaded ${updatedFeedData.items.length} articles from ${feedSource.name}`);
        
        // Cache the app state to prevent unnecessary reloading (store only essential data)
        appStateCache.set('app-state', {
          currentFeedId: feedSource.id,
          feedTitle: updatedFeedData.title,
          itemCount: updatedFeedData.items.length,
          lastBuildDate: updatedFeedData.lastBuildDate,
          timestamp: Date.now()
        });
        
        // Show the feed immediately - summaries will be generated in background
        console.log('Feed loaded and displayed immediately');
    } catch (err) {
      console.error('Error loading feed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load feed';
      setError(errorMessage);
      showError('Failed to load feed', errorMessage);
      
      // If it's a timeout error, provide more helpful message
      if (errorMessage.includes('Timeout')) {
        const timeoutMessage = 'Feed loading timed out. Some feeds may be slow to respond. Try refreshing or check your internet connection.';
        setError(timeoutMessage);
        showError('Timeout', timeoutMessage);
      }
    } finally {
      setLoading(false);
      setLoadingProgress(null);
    }
  };

  const handleItemSelect = (item: RSSItem) => {
    setSelectedItem(item);
  };

  const handleGenerateSummary = async (item: RSSItem) => {
    setGeneratingSummary(true);
    setError(null);

    try {
      console.log('App: Starting to generate summary for:', item.title);

      // For Hacker News, use the extracted article URL, for others use the item link
      const articleUrl = item.link;
      console.log('App: Fetching article content from URL:', articleUrl);
      const articleContent = await fetchArticleContent(articleUrl);

      if (!articleContent || articleContent.trim().length === 0) {
        throw new Error('No content could be extracted from the article');
      }
      
      console.log('App: Article content fetched, generating summary...');
      const summary = await generateSummary(articleContent, currentPrompt?.prompt || '');
      
      // Update the item with the AI summary
      const updatedItem = { ...item, aiSummary: summary };
      setSelectedItem(updatedItem);
      
      // Update the feed to include the summary
      if (feed) {
        console.log('App: Updating feed with summary for item:', item.title);
        setFeed(prevFeed => {
          if (!prevFeed) return prevFeed;
          
          return {
            ...prevFeed,
            items: prevFeed.items.map(feedItem => 
              feedItem.guid === item.guid ? updatedItem : feedItem
            )
          };
        });
      }
      
      console.log('App: Summary generated successfully');
    } catch (err) {
      console.error('App: Error generating summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handlePromptChange = (prompt: AIPrompt) => {
    setCurrentPrompt(prompt);
  };

  const handleAddPrompt = (prompt: AIPrompt) => {
    setAiPrompts(prev => {
      const updatedPrompts = [...prev, prompt];
      storageService.savePrompts(updatedPrompts);
      return updatedPrompts;
    });
  };

  const handleUpdatePrompt = (updated: AIPrompt) => {
    setAiPrompts(prev => {
      const updatedPrompts = prev.map(p => (p.id === updated.id ? updated : p));
      storageService.savePrompts(updatedPrompts);
      // keep current prompt in sync if it was edited
      if (currentPrompt && currentPrompt.id === updated.id) {
        setCurrentPrompt(updated);
      }
      return updatedPrompts;
    });
  };

  const handleRemovePrompt = (promptId: string) => {
    setAiPrompts(prev => {
      const updatedPrompts = prev.filter(p => p.id !== promptId);
      storageService.savePrompts(updatedPrompts);
      // if current prompt removed, switch to first available
      if (currentPrompt && currentPrompt.id === promptId) {
        setCurrentPrompt(updatedPrompts[0] || null);
      }
      return updatedPrompts;
    });
  };

  const handleFeedSelect = (feed: FeedSource) => {
    console.log('Feed selected:', feed.name, feed.id);
    setCurrentFeed(feed);
    storageService.saveCurrentFeedId(feed.id);
    // Show loading state immediately
    setLoading(true);
    setError(null);
  };

  const handleToggleFavorite = (item: RSSItem) => {
    const itemId = item.guid || item.link;
    const isCurrentlyFavorite = favoriteIds.has(itemId);
    
    console.log('Toggle favorite for item:', item.title);
    console.log('Item ID:', itemId);
    console.log('Currently favorite:', isCurrentlyFavorite);
    
    setFavoriteIds(prev => {
      const newFavorites = new Set(prev);
      if (isCurrentlyFavorite) {
        newFavorites.delete(itemId);
        console.log('Removing from favorites');
      } else {
        newFavorites.add(itemId);
        console.log('Adding to favorites');
      }
      storageService.saveFavorites(newFavorites);
      console.log('New favorites:', Array.from(newFavorites));
      return newFavorites;
    });

    // Update saved articles in localStorage
    const allSavedArticles = storageService.loadAllSavedArticles();
    console.log('Current saved articles in storage:', allSavedArticles.length);
    
    if (isCurrentlyFavorite) {
      // Removing from favorites
      const updatedArticles = allSavedArticles.filter(savedItem => (savedItem.guid || savedItem.link) !== itemId);
      console.log('Removing article, new count:', updatedArticles.length);
      storageService.saveAllSavedArticles(updatedArticles);
    } else {
      // Adding to favorites - check if article already exists
      const articleExists = allSavedArticles.some(savedItem => (savedItem.guid || savedItem.link) === itemId);
      console.log('Article exists in storage:', articleExists);
      if (!articleExists) {
        const updatedArticles = [...allSavedArticles, { ...item, isFavorite: true }];
        console.log('Adding article, new count:', updatedArticles.length);
        storageService.saveAllSavedArticles(updatedArticles);
      }
    }

  };

  const handleFeedAdd = (newFeed: FeedSource) => {
    setFeeds(prev => {
      const updatedFeeds = [...prev, newFeed];
      storageService.saveFeeds(updatedFeeds);
      return updatedFeeds;
    });
  };

  const handleFeedRemove = (feedId: string) => {
    setFeeds(prev => {
      const updatedFeeds = prev.filter(f => f.id !== feedId);
      storageService.saveFeeds(updatedFeeds);
      
      // If we're removing the current feed, switch to the first available feed
      if (currentFeed?.id === feedId && updatedFeeds.length > 0) {
        const newCurrentFeed = updatedFeeds[0];
        setCurrentFeed(newCurrentFeed);
        storageService.saveCurrentFeedId(newCurrentFeed.id);
      }
      return updatedFeeds;
    });
  };


  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setSelectedItem(null); // Clear selected item when changing pages
  };


  // Removed generateShortSummaries - now using on-demand generation for better performance


  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 meta">Initializing RSS AI Reader...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-bg">
        <Header 
          title={currentFeed?.name || 'RSS AI Reader'}
          onRefresh={() => currentFeed && loadFeed(currentFeed, true)}
          loading={loading}
        />
      
      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-2 sm:py-6">
        {/* Search and Theme Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            {feed && feed.items.length > 0 && (
              <SearchBar
                items={feed.items}
                onFilteredItems={setFilteredItems}
                placeholder="Search articles..."
              />
            )}
          </div>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={() => setShowMobileSettings(!showMobileSettings)}
              className="sm:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.722-1.756 3.35 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" />
              </svg>
            </button>
          </div>
        </div>
        <PrivacyNotice />
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Error loading feed</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => currentFeed && loadFeed(currentFeed)}
                className="ml-4 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Desktop Sidebar - Hidden on mobile */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="space-y-6">
              <FeedSelector
                feeds={feeds}
                currentFeed={currentFeed}
                onFeedSelect={handleFeedSelect}
                onFeedAdd={handleFeedAdd}
                onFeedRemove={handleFeedRemove}
              />
              
              <PromptSelector
                prompts={aiPrompts}
                currentPrompt={currentPrompt}
                onPromptChange={handlePromptChange}
                onAddPrompt={handleAddPrompt}
                onUpdatePrompt={handleUpdatePrompt}
                onRemovePrompt={handleRemovePrompt}
              />
              
              <PrivacySettings 
                feeds={feeds}
                prompts={aiPrompts}
                currentFeedId={currentFeed?.id || null}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {selectedItem ? (
              <ArticleDetail
                item={selectedItem}
                onGenerateSummary={() => handleGenerateSummary(selectedItem)}
                generatingSummary={generatingSummary}
                currentPrompt={currentPrompt!}
                onToggleFavorite={handleToggleFavorite}
              />
            ) : loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 meta">
                  {loadingProgress 
                    ? `Loading feeds... (${loadingProgress.current}/${loadingProgress.total})`
                    : currentFeed 
                      ? `Loading ${currentFeed.name}...`
                      : 'Loading feed...'
                  }
                </p>
                {loadingProgress && (
                  <div className="mt-4 w-full bg-hover rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}
                    />
                  </div>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  Parsing RSS feed and extracting articles...
                </p>
              </div>
            ) : feed ? (
              <>
                {/* Show skeleton loading while processing */}
                {loading ? (
                  <SkeletonFeedList count={5} />
                ) : (
                  <>
                    <FeedList
                      items={filteredItems}
                      onItemSelect={handleItemSelect}
                      selectedItem={selectedItem}
                      currentPage={currentPage}
                      itemsPerPage={itemsPerPage}
                      onPageChange={handlePageChange}
                      onToggleFavorite={handleToggleFavorite}
                      onSummaryGenerated={(updatedItem) => {
                        const updatedItems = feed.items.map(item => 
                          item.guid === updatedItem.guid || item.link === updatedItem.link ? updatedItem : item
                        );
                        setFeed({ ...feed, items: updatedItems });
                        showSuccess('Summary generated!', 'AI summary has been added to the article');
                      }}
                      onSummaryError={(error) => {
                        console.error('Summary generation failed:', error);
                        showError('Summary failed', error);
                      }}
                      summaryPrompt={shortSummaryPrompt}
                    />
                  </>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Mobile Settings Modal - Only show on mobile */}
      {showMobileSettings && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full max-h-[80vh] rounded-t-lg overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
              <button
                onClick={() => setShowMobileSettings(false)}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[60vh] p-4 space-y-6">
              {/* Feed Management */}
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-3">RSS Feeds</h3>
                <FeedSelector
                  feeds={feeds}
                  currentFeed={currentFeed}
                  onFeedSelect={handleFeedSelect}
                  onFeedAdd={handleFeedAdd}
                  onFeedRemove={handleFeedRemove}
                />
              </div>

              {/* AI Prompts */}
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-3">AI Prompts</h3>
                <PromptSelector
                  prompts={aiPrompts}
                  currentPrompt={currentPrompt}
                  onPromptChange={handlePromptChange}
                  onAddPrompt={handleAddPrompt}
                  onUpdatePrompt={handleUpdatePrompt}
                  onRemovePrompt={handleRemovePrompt}
                />
              </div>

              {/* Privacy Settings */}
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-3">Privacy</h3>
                <PrivacySettings 
                  feeds={feeds}
                  prompts={aiPrompts}
                  currentFeedId={currentFeed?.id || null}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Button - Only show on mobile */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setShowMobileSettings(true)}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </div>
    </ErrorBoundary>
  );
};

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
