// Service to fetch and extract article content from URLs

export const fetchArticleContent = async (url: string): Promise<string> => {
  try {
    console.log('Article Service: Fetching content from URL:', url);
    
    // Use Vite proxy to avoid CORS issues
    const proxyUrl = `/rss-proxy?url=${encodeURIComponent(url)}`;
    console.log('Article Service: Using Vite proxy:', proxyUrl);
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    console.log('Article Service: HTML fetched, extracting content...');
    
    // Extract text content from HTML
    const content = extractTextFromHTML(html);
    console.log('Article Service: Content extracted:', content.substring(0, 200) + '...');
    
    return content;
  } catch (error) {
    console.error('Article Service: Error fetching article content:', error);
    throw new Error('Failed to fetch article content');
  }
};

const extractTextFromHTML = (html: string): string => {
  // Create a temporary DOM element to parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Remove script and style elements
  const scripts = doc.querySelectorAll('script, style, nav, header, footer, aside');
  scripts.forEach(el => el.remove());
  
  // Try to find the main content area
  const mainContent = doc.querySelector('main, article, .content, .post-content, .entry-content, #content, .article-content') || doc.body;
  
  // Extract text content
  let text = mainContent.textContent || (mainContent as HTMLElement).innerText || '';
  
  // Clean up the text
  text = text
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/\n\s*\n/g, '\n') // Replace multiple newlines with single newline
    .trim();
  
  // Limit content length to avoid token limits
  const maxLength = 4000;
  if (text.length > maxLength) {
    text = text.substring(0, maxLength) + '...';
  }
  
  return text;
};
