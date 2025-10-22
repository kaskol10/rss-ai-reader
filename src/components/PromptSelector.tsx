import React, { useState } from 'react';
import { AIPrompt } from '../types';
import { Plus, Settings } from 'lucide-react';

interface PromptSelectorProps {
  prompts: AIPrompt[];
  currentPrompt: AIPrompt | null;
  onPromptChange: (prompt: AIPrompt) => void;
  onAddPrompt: (prompt: AIPrompt) => void;
  onUpdatePrompt?: (prompt: AIPrompt) => void;
  onRemovePrompt?: (promptId: string) => void;
}

const PromptSelector: React.FC<PromptSelectorProps> = ({
  prompts,
  currentPrompt,
  onPromptChange,
  onAddPrompt,
  onUpdatePrompt,
  onRemovePrompt
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPrompt, setNewPrompt] = useState({ name: '', prompt: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ name: string; prompt: string }>({ name: '', prompt: '' });
  const [showManage, setShowManage] = useState(false);

  const handleAddPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPrompt.name.trim() && newPrompt.prompt.trim()) {
      const prompt: AIPrompt = {
        id: Date.now().toString(),
        name: newPrompt.name.trim(),
        prompt: newPrompt.prompt.trim(),
        isDefault: false
      };
      onAddPrompt(prompt);
      setNewPrompt({ name: '', prompt: '' });
      setShowAddForm(false);
    }
  };

  const beginEdit = (p: AIPrompt) => {
    setEditingId(p.id);
    setEditValues({ name: p.name, prompt: p.prompt });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({ name: '', prompt: '' });
  };

  const saveEdit = () => {
    if (!editingId || !onUpdatePrompt) return;
    const name = editValues.name.trim();
    const promptText = editValues.prompt.trim();
    if (!name || !promptText) return;
    const existing = prompts.find(p => p.id === editingId);
    if (!existing) return;
    onUpdatePrompt({ ...existing, name, prompt: promptText });
    cancelEdit();
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-primary flex items-center space-x-2">
          <Settings className="w-4 h-4" />
          <span>AI Summary Prompts</span>
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-1 text-xs text-primary hover:underline"
        >
          <Plus className="w-3 h-3" />
          <span>Add Custom</span>
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-medium text-primary mb-1">Select Prompt</label>
        <select
          value={currentPrompt?.id || ''}
          onChange={(e) => {
            const next = prompts.find(p => p.id === e.target.value);
            if (next) onPromptChange(next);
          }}
          className="w-full px-3 py-2 text-sm border border-border rounded bg-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          {prompts.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-primary">Manage Prompts</span>
        <button
          onClick={() => setShowManage(!showManage)}
          className="text-xs text-primary hover:underline"
        >
          {showManage ? 'Hide' : 'Show'}
        </button>
      </div>

      {showManage && (
        <div className="space-y-2 mb-4">
          {prompts.map((p) => (
            <div key={p.id} className={`p-2 rounded border ${currentPrompt?.id === p.id ? 'border-primary' : 'border-border'}`}>
              {editingId === p.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editValues.name}
                    onChange={e => setEditValues(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Prompt name"
                  />
                  <textarea
                    value={editValues.prompt}
                    onChange={e => setEditValues(prev => ({ ...prev, prompt: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={3}
                    placeholder="Prompt text"
                  />
                  <div className="flex items-center justify-between">
                    <div className="space-x-2">
                      <button onClick={saveEdit} className="px-3 py-1 text-sm bg-primary text-secondary rounded hover:bg-gray-800">Save</button>
                      <button onClick={cancelEdit} className="px-3 py-1 text-sm border border-border rounded hover:bg-hover">Cancel</button>
                    </div>
                    {onRemovePrompt && !p.isDefault && (
                      <button onClick={() => onRemovePrompt(p.id)} className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200">Delete</button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <button
                    onClick={() => onPromptChange(p)}
                    className="text-left flex-1"
                  >
                    <div className="text-xs font-medium text-primary">{p.name}</div>
                    <div className="text-xs text-text-muted line-clamp-2">{p.prompt}</div>
                  </button>
                  <div className="ml-2 space-x-2">
                    <button onClick={() => beginEdit(p)} className="px-2 py-1 text-xs border border-border rounded hover:bg-hover">Edit</button>
                    {onRemovePrompt && !p.isDefault && (
                      <button onClick={() => onRemovePrompt(p.id)} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">Delete</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleAddPrompt} className="bg-secondary p-4 rounded border border-border">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-primary mb-1">
                Prompt Name
              </label>
              <input
                type="text"
                value={newPrompt.name}
                onChange={(e) => setNewPrompt(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Technical Analysis"
                className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-primary mb-1">
                Prompt Text
              </label>
              <textarea
                value={newPrompt.prompt}
                onChange={(e) => setNewPrompt(prev => ({ ...prev, prompt: e.target.value }))}
                placeholder="Enter your custom prompt for AI summaries..."
                className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={3}
                required
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                type="submit"
                className="btn-primary text-sm"
              >
                Add Prompt
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

      <div className="text-xs meta">
        <p>Current prompt: <span className="font-medium text-primary">{currentPrompt?.name || 'None'}</span></p>
        <p className="mt-1 italic">"{currentPrompt?.prompt || 'No prompt selected'}"</p>
      </div>
    </div>
  );
};

export default PromptSelector;
