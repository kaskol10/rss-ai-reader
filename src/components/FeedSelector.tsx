import React, { useState } from 'react';
import { FeedSource } from '../types';
import { Plus, Trash2, ExternalLink } from 'lucide-react';

interface FeedSelectorProps {
  feeds: FeedSource[];
  currentFeed: FeedSource | null;
  onFeedSelect: (feed: FeedSource) => void;
  onFeedAdd: (feed: FeedSource) => void;
  onFeedRemove: (feedId: string) => void;
}

const FeedSelector: React.FC<FeedSelectorProps> = ({
  feeds,
  currentFeed,
  onFeedSelect,
  onFeedAdd,
  onFeedRemove
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFeed, setNewFeed] = useState({ name: '', url: '' });

  const handleAddFeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFeed.name.trim() && newFeed.url.trim()) {
      const feed: FeedSource = {
        id: Date.now().toString(),
        name: newFeed.name.trim(),
        url: newFeed.url.trim(),
        isDefault: false
      };
      onFeedAdd(feed);
      setNewFeed({ name: '', url: '' });
      setShowAddForm(false);
    }
  };

  const handleRemoveFeed = (feedId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onFeedRemove(feedId);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-primary flex items-center space-x-2">
          <ExternalLink className="w-4 h-4" />
          <span>RSS Feeds</span>
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-1 text-xs text-primary hover:underline"
        >
          <Plus className="w-3 h-3" />
          <span>Add Feed</span>
        </button>
      </div>

      <div className="space-y-1 mb-4">
        {feeds.map((feed) => (
          <div
            key={feed.id}
            onClick={() => onFeedSelect(feed)}
            className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
              currentFeed?.id === feed.id
                ? 'bg-primary text-secondary'
                : 'bg-secondary text-primary hover:bg-hover border border-border'
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{feed.name}</div>
              <div className="text-xs opacity-75 truncate">{feed.url}</div>
            </div>
            {!feed.isDefault && (
              <button
                onClick={(e) => handleRemoveFeed(feed.id, e)}
                className="ml-2 p-1 hover:bg-red-100 rounded transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {showAddForm && (
        <form onSubmit={handleAddFeed} className="bg-secondary p-4 rounded border border-border">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-primary mb-1">
                Feed Name
              </label>
              <input
                type="text"
                value={newFeed.name}
                onChange={(e) => setNewFeed(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., TechCrunch"
                className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-primary mb-1">
                RSS URL
              </label>
              <input
                type="url"
                value={newFeed.url}
                onChange={(e) => setNewFeed(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com/rss"
                className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                type="submit"
                className="btn-primary text-sm"
              >
                Add Feed
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default FeedSelector;
