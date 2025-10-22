export interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet?: string;
  content?: string;
  guid?: string;
  categories?: string[];
  creator?: string;
  summary?: string;
  aiSummary?: string;
  shortAiSummary?: string;
  sourceFeed?: string;
  sourceUrl?: string;
  isFavorite?: boolean;
}

export interface RSSFeed {
  title: string;
  description: string;
  link: string;
  items: RSSItem[];
  lastBuildDate?: string;
}

export interface AIPrompt {
  id: string;
  name: string;
  prompt: string;
  isDefault: boolean;
}

export interface FeedSource {
  id: string;
  name: string;
  url: string;
  isDefault: boolean;
}

export interface AppState {
  feeds: FeedSource[];
  currentFeed: FeedSource | null;
  feed: RSSFeed | null;
  loading: boolean;
  error: string | null;
  selectedItem: RSSItem | null;
  aiPrompts: AIPrompt[];
  currentPrompt: AIPrompt | null;
}
