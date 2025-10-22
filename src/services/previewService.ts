// Service to fetch and extract preview content from URLs

export interface PreviewContent {
  title: string;
  description: string;
  image?: string;
  url: string;
  domain: string;
}

// Cache for preview content
const previewCache = new Map<string, { data: PreviewContent; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const fetchPreviewContent = async (url: string): Promise<PreviewContent> => {
  try {
    console.log('Preview Service: Fetching preview content for URL:', url);

    // Check cache first
    if (previewCache.has(url)) {
      const cached = previewCache.get(url)!;
      const now = Date.now();
      if (now - cached.timestamp < CACHE_DURATION) {
        console.log('Preview Service: Using cached preview data for:', url);
        return cached.data;
      } else {
        console.log('Preview Service: Cache expired for:', url);
        previewCache.delete(url);
      }
    }

    // Use Vite proxy to avoid CORS issues
    const proxyUrl = `/rss-proxy?url=${encodeURIComponent(url)}`;
    console.log('Preview Service: Using Vite proxy:', proxyUrl);

    const response = await fetch(proxyUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    console.log('Preview Service: HTML fetched, extracting preview content...');

    // Extract preview content from HTML
    const preview = extractPreviewFromHTML(html, url);
    console.log('Preview Service: Preview content extracted:', preview);

    // Cache the result
    previewCache.set(url, { data: preview, timestamp: Date.now() });
    console.log('Preview Service: Cached preview data for:', url);

    return preview;
  } catch (error) {
    console.error('Preview Service: Error fetching preview content:', error);
    throw new Error('Failed to fetch preview content');
  }
};

const extractPreviewFromHTML = (html: string, url: string): PreviewContent => {
  // Create a temporary DOM element to parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Extract title
  let title = '';
  const titleSelectors = [
    'meta[property="og:title"]',
    'meta[name="twitter:title"]',
    'title',
    'h1'
  ];
  
  for (const selector of titleSelectors) {
    const element = doc.querySelector(selector);
    if (element) {
      title = element.getAttribute('content') || element.textContent || '';
      if (title) break;
    }
  }

  // Extract description
  let description = '';
  const descriptionSelectors = [
    'meta[property="og:description"]',
    'meta[name="twitter:description"]',
    'meta[name="description"]',
    'meta[property="description"]'
  ];
  
  for (const selector of descriptionSelectors) {
    const element = doc.querySelector(selector);
    if (element) {
      description = element.getAttribute('content') || '';
      if (description) break;
    }
  }

  // If no meta description, try to extract from content
  if (!description) {
    const contentSelectors = [
      'article p',
      '.content p',
      '.post-content p',
      '.entry-content p',
      'main p'
    ];
    
    for (const selector of contentSelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        description = element.textContent || '';
        if (description && description.length > 50) {
          description = description.substring(0, 200) + '...';
          break;
        }
      }
    }
  }

  // Extract image
  let image = '';
  const imageSelectors = [
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
    'meta[name="twitter:image:src"]'
  ];
  
  for (const selector of imageSelectors) {
    const element = doc.querySelector(selector);
    if (element) {
      image = element.getAttribute('content') || '';
      if (image) break;
    }
  }

  // Get domain from URL
  const domain = new URL(url).hostname.replace('www.', '');

  return {
    title: title || 'No title available',
    description: description || 'No description available',
    image: image || undefined,
    url,
    domain
  };
};

// Clear expired cache entries
export const clearExpiredCache = () => {
  const now = Date.now();
  for (const [url, cached] of previewCache.entries()) {
    if (now - cached.timestamp > CACHE_DURATION) {
      previewCache.delete(url);
    }
  }
};
