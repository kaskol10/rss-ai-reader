// Service for exporting and importing user data for privacy control

export interface ExportData {
  feeds: any[];
  prompts: any[];
  currentFeedId: string | null;
  exportDate: string;
  version: string;
}

export const exportUserData = (): ExportData => {
  console.log('Export Service: Reading data from localStorage...');
  
  // Read all localStorage keys related to our app
  const allKeys = Object.keys(localStorage);
  const appKeys = allKeys.filter(key => key.startsWith('rss-ai-reader-'));
  console.log('Export Service: Found app keys:', appKeys);
  
  const feeds = JSON.parse(localStorage.getItem('rss-ai-reader-feeds') || '[]');
  const prompts = JSON.parse(localStorage.getItem('rss-ai-reader-prompts') || '[]');
  const currentFeedId = localStorage.getItem('rss-ai-reader-current-feed-id');
  
  console.log('Export Service: Feeds count:', feeds.length);
  console.log('Export Service: Prompts count:', prompts.length);
  console.log('Export Service: Current feed ID:', currentFeedId);
  
  const exportData = {
    feeds,
    prompts,
    currentFeedId,
    exportDate: new Date().toISOString(),
    version: '1.0.0'
  };
  
  console.log('Export Service: Export data:', exportData);
  return exportData;
};

export const importUserData = (data: ExportData): boolean => {
  try {
    if (data.feeds) {
      localStorage.setItem('rss-ai-reader-feeds', JSON.stringify(data.feeds));
    }
    if (data.prompts) {
      localStorage.setItem('rss-ai-reader-prompts', JSON.stringify(data.prompts));
    }
    if (data.currentFeedId) {
      localStorage.setItem('rss-ai-reader-current-feed-id', data.currentFeedId);
    }
    return true;
  } catch (error) {
    console.error('Error importing user data:', error);
    return false;
  }
};

export const clearAllUserData = (): void => {
  localStorage.removeItem('rss-ai-reader-feeds');
  localStorage.removeItem('rss-ai-reader-prompts');
  localStorage.removeItem('rss-ai-reader-current-feed-id');
  console.log('All user data cleared from local storage');
};

export const downloadUserData = (): void => {
  const data = exportUserData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rss-ai-reader-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
