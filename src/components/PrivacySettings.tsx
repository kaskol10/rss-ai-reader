import React, { useState } from 'react';
import { Shield, Download, Upload, Trash2, AlertTriangle } from 'lucide-react';
import { importUserData, clearAllUserData } from '../services/exportService';
import { FeedSource, AIPrompt } from '../types';

interface PrivacySettingsProps {
  feeds: FeedSource[];
  prompts: AIPrompt[];
  currentFeedId: string | null;
}

const PrivacySettings: React.FC<PrivacySettingsProps> = ({ feeds, prompts, currentFeedId }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleExport = () => {
    const exportData = {
      feeds,
      prompts,
      currentFeedId,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    
    console.log('Privacy Settings: Exporting data:', exportData);
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rss-ai-reader-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (importUserData(data)) {
          alert('Data imported successfully! Please refresh the page.');
        } else {
          alert('Error importing data. Please check the file format.');
        }
      } catch (error) {
        alert('Invalid file format. Please select a valid backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    clearAllUserData();
    setShowClearConfirm(false);
    alert('All data cleared! Please refresh the page.');
  };

  return (
    <div className="mb-6">
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="flex items-center space-x-2 text-sm text-primary hover:underline"
      >
        <Shield className="w-4 h-4" />
        <span>Privacy & Data Control</span>
      </button>

      {showSettings && (
        <div className="mt-3 bg-secondary p-4 rounded border border-border">
          <h3 className="text-sm font-medium text-primary mb-3">Data Management</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Export Your Data</p>
                <p className="text-xs text-text-muted">Download all your feeds and settings</p>
              </div>
              <button
                onClick={handleExport}
                className="flex items-center space-x-1 px-3 py-1 bg-primary text-secondary rounded text-sm hover:bg-gray-800"
              >
                <Download className="w-3 h-3" />
                <span>Export</span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Import Data</p>
                <p className="text-xs text-text-muted">Restore from a backup file</p>
              </div>
              <label className="flex items-center space-x-1 px-3 py-1 bg-secondary text-primary border border-border rounded text-sm hover:bg-hover cursor-pointer">
                <Upload className="w-3 h-3" />
                <span>Import</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>

            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Clear All Data</p>
                  <p className="text-xs text-text-muted">Remove all feeds, prompts, and settings</p>
                </div>
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>
            </div>
          </div>

          {showClearConfirm && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Are you sure?</p>
                  <p className="text-xs text-red-700 mt-1">
                    This will permanently delete all your feeds, prompts, and settings. This action cannot be undone.
                  </p>
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={handleClearData}
                      className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                    >
                      Yes, Clear All Data
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PrivacySettings;
