import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const matchingShortcut = shortcuts.find(shortcut => {
      return (
        shortcut.key.toLowerCase() === event.key.toLowerCase() &&
        !!shortcut.ctrlKey === event.ctrlKey &&
        !!shortcut.shiftKey === event.shiftKey &&
        !!shortcut.altKey === event.altKey &&
        !!shortcut.metaKey === event.metaKey
      );
    });

    if (matchingShortcut) {
      event.preventDefault();
      matchingShortcut.action();
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

// Common shortcuts for RSS reader
export const useRSSReaderShortcuts = (actions: {
  onRefresh?: () => void;
  onNextItem?: () => void;
  onPrevItem?: () => void;
  onToggleFavorite?: () => void;
  onGenerateSummary?: () => void;
  onSearch?: () => void;
  onSettings?: () => void;
}) => {
  const shortcuts: KeyboardShortcut[] = [
    ...(actions.onRefresh ? [{
      key: 'r',
      ctrlKey: true,
      action: actions.onRefresh,
      description: 'Refresh feed'
    }] : []),
    ...(actions.onNextItem ? [{
      key: 'j',
      action: actions.onNextItem,
      description: 'Next item'
    }] : []),
    ...(actions.onPrevItem ? [{
      key: 'k',
      action: actions.onPrevItem,
      description: 'Previous item'
    }] : []),
    ...(actions.onToggleFavorite ? [{
      key: 'f',
      action: actions.onToggleFavorite,
      description: 'Toggle favorite'
    }] : []),
    ...(actions.onGenerateSummary ? [{
      key: 's',
      action: actions.onGenerateSummary,
      description: 'Generate summary'
    }] : []),
    ...(actions.onSearch ? [{
      key: '/',
      action: actions.onSearch,
      description: 'Search'
    }] : []),
    ...(actions.onSettings ? [{
      key: ',',
      action: actions.onSettings,
      description: 'Settings'
    }] : []),
  ];

  useKeyboardShortcuts(shortcuts);
};
