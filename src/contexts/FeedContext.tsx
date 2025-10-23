import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { RSSItem, FeedSource } from '../types';
import { fetchRSSFeed, fetchAllFeeds } from '../services/rssService';

interface FeedData {
  title: string;
  description: string;
  link: string;
  items: RSSItem[];
  lastBuildDate?: string;
}

interface FeedContextType {
  // State
  feed: FeedData | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadFeed: (feedSource: FeedSource, bypassCache?: boolean) => Promise<void>;
  loadAllFeeds: (feedSources: FeedSource[], bypassCache?: boolean) => Promise<void>;
  clearError: () => void;
}

const FeedContext = createContext<FeedContextType | undefined>(undefined);

interface FeedProviderProps {
  children: ReactNode;
}

export const FeedProvider: React.FC<FeedProviderProps> = ({ children }) => {
  const [feed, setFeed] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async (feedSource: FeedSource, bypassCache: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('FeedProvider: Loading feed:', feedSource.name);
      
      const feedData = await fetchRSSFeed(feedSource.url, !bypassCache);
      setFeed(feedData);
      
      console.log('FeedProvider: Feed loaded successfully:', feedData.title);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load feed';
      console.error('FeedProvider: Error loading feed:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAllFeeds = useCallback(async (feedSources: FeedSource[], bypassCache: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('FeedProvider: Loading all feeds:', feedSources.length);
      
      const feedUrls = feedSources.map(source => source.url);
      const combinedFeed = await fetchAllFeeds(feedUrls, 10000, !bypassCache);
      setFeed(combinedFeed);
      
      console.log('FeedProvider: All feeds loaded successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load feeds';
      console.error('FeedProvider: Error loading feeds:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: FeedContextType = {
    feed,
    loading,
    error,
    loadFeed,
    loadAllFeeds,
    clearError,
  };

  return (
    <FeedContext.Provider value={value}>
      {children}
    </FeedContext.Provider>
  );
};

export const useFeed = (): FeedContextType => {
  const context = useContext(FeedContext);
  if (context === undefined) {
    throw new Error('useFeed must be used within a FeedProvider');
  }
  return context;
};
