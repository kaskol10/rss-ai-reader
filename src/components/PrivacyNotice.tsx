import React, { useState } from 'react';
import { Shield, Eye, EyeOff, Database, Lock } from 'lucide-react';

const PrivacyNotice: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-green-800 mb-1">
              Privacy-First RSS Reader
            </h3>
            <div className="text-xs space-y-1">
              <div className="flex items-center space-x-2">
                <Lock className="w-3 h-3" />
                <span>All data stored locally in your browser</span>
              </div>
              <div className="flex items-center space-x-2">
                <Database className="w-3 h-3" />
                <span>No tracking, analytics, or data collection</span>
              </div>
              <div className="flex items-center space-x-2">
                <Eye className="w-3 h-3" />
                <span>AI summaries use anonymous requests only</span>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-green-600 hover:text-green-800 ml-2"
        >
          <EyeOff className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PrivacyNotice;
