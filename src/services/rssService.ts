import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_"
});

// Helper function to safely extract text content from nested objects
const extractTextContent = (obj: any): string => {
  if (!obj) return '';
  
  if (typeof obj === 'string') {
    return obj;
  }
  
  if (typeof obj === 'number') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(extractTextContent).join(' ').trim();
  }
  
  if (typeof obj === 'object') {
    // Try common text content properties
    if (obj['#text']) return obj['#text'];
    if (obj.text) return extractTextContent(obj.text);
    if (obj.value) return extractTextContent(obj.value);
    if (obj.content) return extractTextContent(obj.content);
    
    // If it's an object with a single string property, use that
    const keys = Object.keys(obj);
    if (keys.length === 1 && typeof obj[keys[0]] === 'string') {
      return obj[keys[0]];
    }
    
    // Try to find any string value in the object
    for (const key of keys) {
      if (typeof obj[key] === 'string' && obj[key].trim()) {
        return obj[key];
      }
    }
  }
  
  return '';
};

// Cache for RSS feeds (single and combined)
const feedCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export const fetchRSSFeed = async (url: string, useCache: boolean = true) => {
  try {
    console.log('RSS Service: Starting to parse URL:', url);
    
    // Check cache first
    if (useCache && feedCache.has(url)) {
      const cached = feedCache.get(url)!;
      const now = Date.now();
      if (now - cached.timestamp < CACHE_DURATION) {
        console.log('RSS Service: Using cached data for:', url);
        return cached.data;
      } else {
        console.log('RSS Service: Cache expired for:', url);
        feedCache.delete(url);
      }
    }
    
    // Use Vite proxy to avoid CORS issues
    const proxyUrl = `/rss-proxy?url=${encodeURIComponent(url)}`;
    console.log('RSS Service: Using Vite proxy:', proxyUrl);
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const xmlText = await response.text();
    console.log('RSS Service: XML fetched, parsing...');
    console.log('RSS Service: XML content preview:', xmlText.substring(0, 500));
    
    const feedData = parser.parse(xmlText);
    console.log('RSS Service: Feed parsed successfully:', feedData);
    
    // Extract RSS data from parsed XML - handle both RSS and Atom feeds
    const rss = feedData.rss || feedData.feed;
    const channel = rss.channel || rss;
    
    // Handle both RSS items and Atom entries
    let items = [];
    if (channel.item) {
      // RSS format
      items = Array.isArray(channel.item) ? channel.item : [channel.item];
    } else if (rss.entry) {
      // Atom feed format
      items = Array.isArray(rss.entry) ? rss.entry : [rss.entry];
    } else if (feedData.entry) {
      // Alternative Atom format
      items = Array.isArray(feedData.entry) ? feedData.entry : [feedData.entry];
    }
    
    console.log('RSS Service: Feed type detected:', rss ? 'RSS' : 'Atom');
    console.log('RSS Service: Items found:', items.length);
    
    console.log('RSS Service: Found items:', items.length);
    
    const processedFeed = {
      title: extractTextContent(channel.title || rss.title) || 'Unknown Feed',
      description: extractTextContent(channel.description || rss.subtitle || rss.description) || '',
      link: extractTextContent(channel.link || rss.link) || '',
      items: items.map((item: any, index: number) => {
        console.log(`RSS Service: Processing item ${index + 1}:`, item);
        
        // Handle different link formats (RSS and Atom)
        let link = '';
        if (item.link) {
          if (typeof item.link === 'string') {
            link = item.link;
          } else if (item.link['@_href']) {
            link = item.link['@_href'];
          } else if (item.link.href) {
            link = item.link.href;
          } else if (Array.isArray(item.link)) {
            // Atom can have multiple links, prefer the first one
            const firstLink = item.link[0];
            if (typeof firstLink === 'string') {
              link = firstLink;
            } else if (firstLink['@_href']) {
              link = firstLink['@_href'];
            } else if (firstLink.href) {
              link = firstLink.href;
            }
          }
        }
        
        // Handle different content formats (RSS and Atom)
        let content = '';
        if (item['content:encoded']) {
          // RSS content:encoded
          content = extractTextContent(item['content:encoded']);
        } else if (item.content) {
          // Atom content
          content = extractTextContent(item.content);
        } else if (item.description) {
          // RSS description
          content = extractTextContent(item.description);
        } else if (item.summary) {
          // Atom summary
          content = extractTextContent(item.summary);
        }
        
        // For Hacker News, try to extract the actual article URL from the description or content
        let finalLink = link;

        // Check if this is a Hacker News comment link
        if (link.includes('news.ycombinator.com/item?id=')) {
          console.log('RSS Service: Detected Hacker News comment link:', link);
          const contentToSearch = item.description || item['content:encoded'] || item.content || '';
          console.log('RSS Service: Hacker News item content preview:', contentToSearch.substring(0, 500));
          
          if (contentToSearch && contentToSearch.includes('href=')) {
            // Try different URL extraction patterns - more comprehensive
            const patterns = [
              /href="([^"]+)"/g,  // Standard href="url"
              /href='([^']+)'/g,  // href='url'
              /href=([^\s>]+)/g,  // href=url (without quotes)
              /<a[^>]+href=["']([^"']+)["'][^>]*>/g  // Full anchor tag
            ];
            
            let foundValidUrl = false;
            for (const pattern of patterns) {
              const urlMatches = contentToSearch.match(pattern);
              console.log('RSS Service: Found URL matches with pattern:', pattern, urlMatches);
              if (urlMatches) {
                for (const match of urlMatches) {
                  let url = '';
                  if (pattern.source.includes('<a')) {
                    // Extract URL from full anchor tag
                    const urlMatch = match.match(/href=["']([^"']+)["']/);
                    url = urlMatch ? urlMatch[1] : '';
                  } else {
                    // Extract URL from href attribute
                    url = match.replace(/href=["']?/, '').replace(/["']$/, '');
                  }
                  
                  // Clean up the URL
                  if (url.startsWith('"') || url.startsWith("'")) {
                    url = url.slice(1);
                  }
                  if (url.endsWith('"') || url.endsWith("'")) {
                    url = url.slice(0, -1);
                  }
                  
                  console.log('RSS Service: Checking URL:', url);
                  
                  // Skip Hacker News internal links and find the actual article URL
                  if (url && 
                      !url.includes('news.ycombinator.com') && 
                      !url.includes('item?id=') && 
                      !url.includes('ycombinator.com') &&
                      (url.startsWith('http://') || url.startsWith('https://'))) {
                    finalLink = url;
                    console.log('RSS Service: Using extracted article URL:', finalLink);
                    foundValidUrl = true;
                    break;
                  }
                }
                if (foundValidUrl) break; // Found a valid URL, stop searching
              }
            }
            
            if (!foundValidUrl) {
              console.log('RSS Service: No valid external URL found, keeping original HN link');
            }
          } else {
            console.log('RSS Service: No href attributes found in content');
          }
        }
        
        return {
          title: extractTextContent(item.title) || '',
          link: finalLink,
          pubDate: extractTextContent(item.pubDate || item.published || item.updated || item['dc:date']) || '',
          contentSnippet: extractTextContent(item.description || item.summary) || content.substring(0, 200) || '',
          content: content,
          guid: extractTextContent(item.guid || item.id) || `item-${index}`,
          categories: Array.isArray(item.category) ? item.category.map(extractTextContent) : (item.category ? [extractTextContent(item.category)] : []),
          creator: extractTextContent(item['dc:creator'] || item.creator || item.author || (item.author && item.author.name ? item.author.name : '')) || '',
          summary: extractTextContent(item.description || item.summary) || content.substring(0, 200) || '',
          sourceFeed: extractTextContent(channel.title || rss.title) || 'Unknown Feed',
          sourceUrl: extractTextContent(channel.link || rss.link) || ''
        };
      }),
      lastBuildDate: channel.lastBuildDate || channel.updated || rss.updated
    };

    // Sort items by publication date (newest first)
    processedFeed.items.sort((a: any, b: any) => {
      const dateA = new Date(a.pubDate).getTime();
      const dateB = new Date(b.pubDate).getTime();
      
      // Handle invalid dates by putting them at the end
      if (isNaN(dateA) && isNaN(dateB)) return 0;
      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;
      
      return dateB - dateA;
    });
    
    console.log('RSS Service: Processed feed:', processedFeed);
    
    // Cache the result
    if (useCache) {
      feedCache.set(url, { data: processedFeed, timestamp: Date.now() });
      console.log('RSS Service: Cached feed data for:', url);
    }
    
    return processedFeed;
  } catch (error) {
    console.error('RSS Service: Error fetching RSS feed:', error);
    throw new Error('Failed to fetch RSS feed');
  }
};

// Function to fetch all feeds and combine them
export const fetchAllFeeds = async (feedUrls: string[], timeout: number = 10000, useCache: boolean = true) => {
  try {
    console.log('RSS Service: Fetching all feeds:', feedUrls);
    
    if (feedUrls.length === 0) {
      throw new Error('No feed URLs provided');
    }

    // Build a stable cache key for the combined feed
    const sortedUrls = [...feedUrls].sort();
    const cacheKey = `ALL:${sortedUrls.join('|')}`;

    // Try cache first
    if (useCache && feedCache.has(cacheKey)) {
      const cached = feedCache.get(cacheKey)!;
      const now = Date.now();
      if (now - cached.timestamp < CACHE_DURATION) {
        console.log('RSS Service: Using cached combined feed');
        return cached.data;
      } else {
        console.log('RSS Service: Combined cache expired');
        feedCache.delete(cacheKey);
      }
    }
    
    // Add timeout wrapper for each feed
    const fetchWithTimeout = async (url: string) => {
      return Promise.race([
        fetchRSSFeed(url),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout: ${url} took longer than ${timeout}ms`)), timeout)
        )
      ]);
    };
    
    const feedPromises = feedUrls.map(async (url, index) => {
      try {
        console.log(`RSS Service: Fetching feed ${index + 1}/${feedUrls.length}: ${url}`);
        const startTime = Date.now();
        const feed = await fetchWithTimeout(url) as any;
        const duration = Date.now() - startTime;
        console.log(`RSS Service: Feed ${index + 1} completed in ${duration}ms`);
        return feed;
      } catch (error) {
        console.error(`RSS Service: Failed to fetch feed ${url}:`, error);
        return null;
      }
    });
    
    console.log('RSS Service: Waiting for all feeds to complete...');
    const feeds = await Promise.allSettled(feedPromises);
    const validFeeds = feeds
      .filter(result => result.status === 'fulfilled' && result.value !== null)
      .map(result => (result as PromiseFulfilledResult<any>).value);
    
    console.log(`RSS Service: Successfully loaded ${validFeeds.length}/${feedUrls.length} feeds`);
    
    if (validFeeds.length === 0) {
      throw new Error('No feeds could be loaded');
    }
    
    // Combine all items from all feeds
    const allItems = validFeeds.flatMap(feed => {
      if (!feed.items || !Array.isArray(feed.items)) {
        console.warn('RSS Service: Feed has no items or items is not an array:', feed.title);
        return [];
      }
      return feed.items.map((item: any) => ({
        ...item,
        sourceFeed: feed.title,
        sourceUrl: feed.link
      }));
    });
    
    console.log(`RSS Service: Combined ${allItems.length} items from ${validFeeds.length} feeds`);
    
    // Sort by publication date (newest first)
    allItems.sort((a: any, b: any) => {
      const dateA = new Date(a.pubDate).getTime();
      const dateB = new Date(b.pubDate).getTime();
      
      // Handle invalid dates by putting them at the end
      if (isNaN(dateA) && isNaN(dateB)) return 0;
      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;
      
      return dateB - dateA;
    });
    
    const combinedFeed = {
      title: 'All Feeds',
      description: `Combined feed from ${validFeeds.length} sources`,
      link: '',
      items: allItems,
      lastBuildDate: new Date().toISOString()
    };
    
    console.log('RSS Service: Combined feed created successfully');

    // Cache combined result
    if (useCache) {
      feedCache.set(cacheKey, { data: combinedFeed, timestamp: Date.now() });
      console.log('RSS Service: Cached combined feed');
    }

    return combinedFeed;
  } catch (error) {
    console.error('RSS Service: Error fetching all feeds:', error);
    throw new Error(`Failed to fetch all feeds: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};