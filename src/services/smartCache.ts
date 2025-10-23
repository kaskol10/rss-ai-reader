// Simplified, smart caching system
interface CacheItem<T> {
  value: T;
  timestamp: number;
  expiration: number;
}

export class SmartCache<T> {
  private cacheKey: string;
  private defaultExpiration: number;

  constructor(cacheKey: string, defaultExpiration: number) {
    this.cacheKey = cacheKey;
    this.defaultExpiration = defaultExpiration;
  }

  private loadCache(): Record<string, CacheItem<T>> {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (cached) {
        const cache: Record<string, CacheItem<T>> = JSON.parse(cached);
        const now = Date.now();
        
        // Clean expired items during load
        for (const key in cache) {
          if (cache.hasOwnProperty(key) && now > cache[key].timestamp + cache[key].expiration) {
            delete cache[key];
          }
        }
        return cache;
      }
      return {};
    } catch (error) {
      console.error(`SmartCache: Error loading cache:`, error);
      return {};
    }
  }

  private saveCache(cache: Record<string, CacheItem<T>>): void {
    try {
      const serialized = JSON.stringify(cache);
      
      // Check size limit (4MB)
      if (serialized.length > 4 * 1024 * 1024) {
        this.cleanupOldEntries(cache);
        const cleanedSerialized = JSON.stringify(cache);
        localStorage.setItem(this.cacheKey, cleanedSerialized);
      } else {
        localStorage.setItem(this.cacheKey, serialized);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.cleanupOldEntries(cache);
        try {
          const cleanedSerialized = JSON.stringify(cache);
          localStorage.setItem(this.cacheKey, cleanedSerialized);
        } catch (retryError) {
          console.error(`SmartCache: Still exceeded quota after cleanup:`, retryError);
          this.clear();
        }
      } else {
        console.error(`SmartCache: Error saving cache:`, error);
      }
    }
  }

  private cleanupOldEntries(cache: Record<string, CacheItem<T>>): void {
    const entries = Object.entries(cache);
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 25%
    const entriesToRemove = Math.floor(entries.length * 0.25);
    for (let i = 0; i < entriesToRemove; i++) {
      delete cache[entries[i][0]];
    }
    
    console.log(`SmartCache: Cleaned up ${entriesToRemove} old entries from ${this.cacheKey}`);
  }

  set(key: string, value: T, expiration?: number): void {
    const cache = this.loadCache();
    cache[key] = {
      value,
      timestamp: Date.now(),
      expiration: expiration || this.defaultExpiration,
    };
    this.saveCache(cache);
  }

  get(key: string): T | undefined {
    const cache = this.loadCache();
    const item = cache[key];
    if (!item) return undefined;
    
    const now = Date.now();
    if (now > item.timestamp + item.expiration) {
      this.delete(key);
      return undefined;
    }
    return item.value;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    const cache = this.loadCache();
    delete cache[key];
    this.saveCache(cache);
  }

  clear(): void {
    try {
      localStorage.removeItem(this.cacheKey);
      console.log(`SmartCache: Cleared cache for ${this.cacheKey}`);
    } catch (error) {
      console.error(`SmartCache: Error clearing cache for ${this.cacheKey}:`, error);
    }
  }

  getStats(): { totalItems: number; expiredItems: number; validItems: number } {
    try {
      const cache = this.loadCache();
      const now = Date.now();
      let totalItems = 0;
      let expiredItems = 0;
      let validItems = 0;

      for (const key in cache) {
        if (cache.hasOwnProperty(key)) {
          totalItems++;
          if (now > cache[key].timestamp + cache[key].expiration) {
            expiredItems++;
          } else {
            validItems++;
          }
        }
      }
      return { totalItems, expiredItems, validItems };
    } catch (error) {
      console.error('SmartCache: Error getting cache stats:', error);
      return { totalItems: 0, expiredItems: 0, validItems: 0 };
    }
  }
}

// Create cache instances with different expiration times
export const feedCache = new SmartCache<any>('rss-ai-feed-cache', 10 * 60 * 1000); // 10 minutes
export const summaryCache = new SmartCache<string>('rss-ai-summary-cache', 24 * 60 * 60 * 1000); // 24 hours
export const previewCache = new SmartCache<any>('rss-ai-preview-cache', 30 * 60 * 1000); // 30 minutes
export const appStateCache = new SmartCache<any>('rss-ai-app-state-cache', 2 * 60 * 1000); // 2 minutes

// Utility functions
export const cleanExpiredCache = (): void => {
  try {
    const caches = [feedCache, summaryCache, previewCache, appStateCache];
    caches.forEach(cache => cache.getStats()); // Trigger cleanup
    console.log('SmartCache: Expired cache items cleaned');
  } catch (error) {
    console.error('SmartCache: Error cleaning expired cache:', error);
  }
};

export const clearAllCaches = (): void => {
  try {
    feedCache.clear();
    summaryCache.clear();
    previewCache.clear();
    appStateCache.clear();
    console.log('SmartCache: All caches cleared');
  } catch (error) {
    console.error('SmartCache: Error clearing all caches:', error);
  }
};

// Initialize cache cleanup on app start
if (typeof window !== 'undefined') {
  cleanExpiredCache();
}
