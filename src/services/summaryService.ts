import { RSSItem } from '../types';
import { generateShortSummary } from './aiService';
import { fetchArticleContent } from './articleService';
import { summaryCache } from './cacheService';

export interface SummaryResult {
  success: boolean;
  item: RSSItem;
  error?: string;
}

export class SummaryService {
  private static instance: SummaryService;
  private generatingSummaries = new Set<string>();

  static getInstance(): SummaryService {
    if (!SummaryService.instance) {
      SummaryService.instance = new SummaryService();
    }
    return SummaryService.instance;
  }

  async generateSummaryForItem(
    item: RSSItem, 
    prompt: string
  ): Promise<SummaryResult> {
    const itemId = item.guid || item.link;
    
    // Check if already generating
    if (this.generatingSummaries.has(itemId)) {
      return {
        success: false,
        item,
        error: 'Summary already being generated for this item'
      };
    }

    try {
      this.generatingSummaries.add(itemId);
      
      const cacheKey = `${item.link}-${item.title}`;
      
      // Check cache first
      if (summaryCache.has(cacheKey)) {
        const cachedSummary = summaryCache.get(cacheKey);
        return {
          success: true,
          item: { ...item, shortAiSummary: cachedSummary || undefined }
        };
      }

      // For Hacker News, fetch the actual article content
      let content = '';
      if (item.sourceFeed === 'Hacker News' && item.link && !item.link.includes('news.ycombinator.com')) {
        console.log(`SummaryService: Fetching article content for Hacker News: ${item.title}`);
        try {
          content = await fetchArticleContent(item.link);
          console.log(`SummaryService: Successfully fetched content, length: ${content.length}`);
        } catch (error) {
          console.error(`SummaryService: Failed to fetch content:`, error);
          content = item.contentSnippet || '';
        }
      } else {
        content = item.contentSnippet || '';
      }

      if (content && content.length > 30) {
        const shortSummary = await generateShortSummary(content, prompt);
        
        // Cache the summary
        summaryCache.set(cacheKey, shortSummary);
        
        return {
          success: true,
          item: { ...item, shortAiSummary: shortSummary || undefined }
        };
      }

      return {
        success: false,
        item,
        error: 'Insufficient content for summary generation'
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`SummaryService: Failed to generate summary for ${item.title}:`, errorMessage);
      
      return {
        success: false,
        item,
        error: errorMessage
      };
    } finally {
      this.generatingSummaries.delete(itemId);
    }
  }

  isGenerating(itemId: string): boolean {
    return this.generatingSummaries.has(itemId);
  }

  getGeneratingCount(): number {
    return this.generatingSummaries.size;
  }

  clearGenerating(): void {
    this.generatingSummaries.clear();
  }
}

// Export singleton instance
export const summaryService = SummaryService.getInstance();
