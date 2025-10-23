// Persistent cache service for RSS feeds, AI summaries, and preview content

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class PersistentCache<T> {
  private cacheKey: string;
  private defaultTtl: number; // Time to live in milliseconds

  constructor(cacheKey: string, defaultTtl: number = 30 * 60 * 1000) { // 30 minutes default
    this.cacheKey = cacheKey;
    this.defaultTtl = defaultTtl;
  }

  set(key: string, data: T, ttl?: number): void {
    try {
      const now = Date.now();
      const expiresAt = now + (ttl || this.defaultTtl);
      
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: now,
        expiresAt
      };

      const cache = this.loadCache();
      cache[key] = cacheItem;
      this.saveCache(cache);
    } catch (error) {
      console.error(`Cache Service: Error setting cache for ${key}:`, error);
    }
  }

  get(key: string): T | null {
    try {
      const cache = this.loadCache();
      const item = cache[key];
      
      if (!item) {
        return null;
      }

      const now = Date.now();
      if (now > item.expiresAt) {
        // Item expired, remove it
        delete cache[key];
        this.saveCache(cache);
        return null;
      }

      return item.data;
    } catch (error) {
      console.error(`Cache Service: Error getting cache for ${key}:`, error);
      return null;
    }
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    try {
      const cache = this.loadCache();
      delete cache[key];
      this.saveCache(cache);
    } catch (error) {
      console.error(`Cache Service: Error deleting cache for ${key}:`, error);
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(this.cacheKey);
    } catch (error) {
      console.error(`Cache Service: Error clearing cache:`, error);
    }
  }

  private loadCache(): Record<string, CacheItem<T>> {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      console.error(`Cache Service: Error loading cache:`, error);
      return {};
    }
  }

  private saveCache(cache: Record<string, CacheItem<T>>): void {
    try {
      const serialized = JSON.stringify(cache);
      
      // Check if we're approaching quota limit
      if (serialized.length > 4 * 1024 * 1024) { // 4MB limit
        console.warn(`Cache Service: Approaching quota limit for ${this.cacheKey}, cleaning up...`);
        this.cleanupOldEntries(cache);
        const cleanedSerialized = JSON.stringify(cache);
        localStorage.setItem(this.cacheKey, cleanedSerialized);
      } else {
        localStorage.setItem(this.cacheKey, serialized);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn(`Cache Service: Quota exceeded for ${this.cacheKey}, cleaning up...`);
        this.cleanupOldEntries(cache);
        try {
          const cleanedSerialized = JSON.stringify(cache);
          localStorage.setItem(this.cacheKey, cleanedSerialized);
        } catch (retryError) {
          console.error(`Cache Service: Still exceeded quota after cleanup:`, retryError);
          // Clear the cache entirely if still too large
          this.clear();
        }
      } else {
        console.error(`Cache Service: Error saving cache:`, error);
      }
    }
  }

  private cleanupOldEntries(cache: Record<string, CacheItem<T>>): void {
    const entries = Object.entries(cache);
    
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 25% of entries
    const entriesToRemove = Math.floor(entries.length * 0.25);
    for (let i = 0; i < entriesToRemove; i++) {
      delete cache[entries[i][0]];
    }
    
    console.log(`Cache Service: Cleaned up ${entriesToRemove} old entries from ${this.cacheKey}`);
  }

  // Get cache statistics
  getStats(): { totalItems: number; expiredItems: number; validItems: number } {
    try {
      const cache = this.loadCache();
      const now = Date.now();
      let expiredItems = 0;
      let validItems = 0;

      Object.values(cache).forEach(item => {
        if (now > item.expiresAt) {
          expiredItems++;
        } else {
          validItems++;
        }
      });

      return {
        totalItems: Object.keys(cache).length,
        expiredItems,
        validItems
      };
    } catch (error) {
      console.error(`Cache Service: Error getting stats:`, error);
      return { totalItems: 0, expiredItems: 0, validItems: 0 };
    }
  }
}

// Create cache instances for different data types
export const feedCache = new PersistentCache<any>('rss-ai-feed-cache', 10 * 60 * 1000); // 10 minutes
export const summaryCache = new PersistentCache<string>('rss-ai-summary-cache', 24 * 60 * 60 * 1000); // 24 hours
export const previewCache = new PersistentCache<any>('rss-ai-preview-cache', 30 * 60 * 1000); // 30 minutes

// Cache for app state to prevent unnecessary reloads (shorter duration to reduce size)
export const appStateCache = new PersistentCache<any>('rss-ai-app-state-cache', 2 * 60 * 1000); // 2 minutes

// Utility function to clean expired items from all caches
export const cleanExpiredCache = (): void => {
  try {
    const caches = [feedCache, summaryCache, previewCache, appStateCache];
    caches.forEach(cache => {
      const stats = cache.getStats();
      if (stats.expiredItems > 0) {
        console.log(`Cache Service: Cleaning ${stats.expiredItems} expired items from ${cache['cacheKey']}`);
        // Force reload to clean expired items
        const allKeys = Object.keys(JSON.parse(localStorage.getItem(cache['cacheKey']) || '{}'));
        allKeys.forEach(key => {
          if (!cache.has(key)) {
            cache.delete(key);
          }
        });
      }
    });
  } catch (error) {
    console.error('Cache Service: Error cleaning expired cache:', error);
  }
};

// Utility function to clear all caches (useful for debugging or when quota is exceeded)
export const clearAllCaches = (): void => {
  try {
    feedCache.clear();
    summaryCache.clear();
    previewCache.clear();
    appStateCache.clear();
    console.log('Cache Service: All caches cleared');
  } catch (error) {
    console.error('Cache Service: Error clearing all caches:', error);
  }
};

// Initialize cache cleanup on app start
if (typeof window !== 'undefined') {
  cleanExpiredCache();
}
