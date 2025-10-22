import { FeedSource, AIPrompt } from '../types';

const STORAGE_KEYS = {
  FEEDS: 'rss-ai-feeds',
  AI_PROMPTS: 'rss-ai-prompts',
  CURRENT_FEED_ID: 'rss-ai-current-feed-id',
  FAVORITES: 'rss-ai-favorites',
  SAVED_ARTICLES: 'rss-ai-saved-articles'
} as const;

export const storageService = {
  // Feed management
  saveFeeds: (feeds: FeedSource[]): void => {
    try {
      const customFeeds = feeds.filter(feed => !feed.isDefault);
      localStorage.setItem(STORAGE_KEYS.FEEDS, JSON.stringify(customFeeds));
    } catch (error) {
      console.error('Error saving feeds to localStorage:', error);
    }
  },

  loadFeeds: (defaultFeeds: FeedSource[]): FeedSource[] => {
    try {
      const savedFeeds = localStorage.getItem(STORAGE_KEYS.FEEDS);
      if (savedFeeds) {
        const customFeeds: FeedSource[] = JSON.parse(savedFeeds);
        return [...defaultFeeds, ...customFeeds];
      }
      return defaultFeeds;
    } catch (error) {
      console.error('Error loading feeds from localStorage:', error);
      return defaultFeeds;
    }
  },

  // AI Prompts management
  savePrompts: (prompts: AIPrompt[]): void => {
    try {
      const customPrompts = prompts.filter(prompt => !prompt.isDefault);
      localStorage.setItem(STORAGE_KEYS.AI_PROMPTS, JSON.stringify(customPrompts));
    } catch (error) {
      console.error('Error saving prompts to localStorage:', error);
    }
  },

  loadPrompts: (defaultPrompts: AIPrompt[]): AIPrompt[] => {
    try {
      const savedPrompts = localStorage.getItem(STORAGE_KEYS.AI_PROMPTS);
      if (savedPrompts) {
        const customPrompts: AIPrompt[] = JSON.parse(savedPrompts);
        return [...defaultPrompts, ...customPrompts];
      }
      return defaultPrompts;
    } catch (error) {
      console.error('Error loading prompts from localStorage:', error);
      return defaultPrompts;
    }
  },

  // Current feed persistence
  saveCurrentFeedId: (feedId: string): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_FEED_ID, feedId);
    } catch (error) {
      console.error('Error saving current feed ID to localStorage:', error);
    }
  },

  loadCurrentFeedId: (): string | null => {
    try {
      return localStorage.getItem(STORAGE_KEYS.CURRENT_FEED_ID);
    } catch (error) {
      console.error('Error loading current feed ID from localStorage:', error);
      return null;
    }
  },

    // Favorites management
    saveFavorites: (favoriteIds: Set<string>): void => {
      try {
        const favoritesArray = Array.from(favoriteIds);
        localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favoritesArray));
      } catch (error) {
        console.error('Error saving favorites to localStorage:', error);
      }
    },

    loadFavorites: (): Set<string> => {
      try {
        const savedFavorites = localStorage.getItem(STORAGE_KEYS.FAVORITES);
        if (savedFavorites) {
          const favoritesArray: string[] = JSON.parse(savedFavorites);
          return new Set(favoritesArray);
        }
        return new Set();
      } catch (error) {
        console.error('Error loading favorites from localStorage:', error);
        return new Set();
      }
    },

    // Clear all data (useful for debugging)
    clearAll: (): void => {
      try {
        Object.values(STORAGE_KEYS).forEach(key => {
          localStorage.removeItem(key);
        });
        console.log('All RSS AI Reader data cleared from localStorage');
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
    },

    // Saved articles management
    saveAllSavedArticles: (articles: any[]): void => {
      try {
        localStorage.setItem(STORAGE_KEYS.SAVED_ARTICLES, JSON.stringify(articles));
      } catch (error) {
        console.error('Error saving all saved articles to localStorage:', error);
      }
    },

    loadAllSavedArticles: (): any[] => {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.SAVED_ARTICLES);
        if (saved) {
          return JSON.parse(saved);
        }
        return [];
      } catch (error) {
        console.error('Error loading all saved articles from localStorage:', error);
        return [];
      }
    }
};
