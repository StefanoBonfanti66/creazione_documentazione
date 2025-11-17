
import React, { useState } from 'react';
import { XIcon } from './icons';

interface SaveDocumentModalProps {
  title: string;
  categories: string[];
  existingTags: string[];
  onSave: (title: string, category: string, tags: string[]) => void;
  onClose: () => void;
}

export const SaveDocumentModal: React.FC<SaveDocumentModalProps> = ({ title, categories, existingTags, onSave, onClose }) => {
  const [docTitle, setDocTitle] = useState(title);
  const [category, setCategory] = useState(categories[0] || 'General');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [tags, setTags] = useState('');

  const handleSave = () => {
    const finalCategory = isCustomCategory ? customCategory.trim() : category;
    if (!docTitle.trim() || !finalCategory) {
        alert("Title and category are required.");
        return;
    }
    const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
    onSave(docTitle, finalCategory, tagArray);
  };
  
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (e.target.value === 'new') {
          setIsCustomCategory(true);
      } else {
          setIsCustomCategory(false);
          setCategory(e.target.value);
      }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-30 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Save Document</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Title</label>
            <input
              type="text"
              id="title"
              value={docTitle}
              onChange={e => setDocTitle(e.target.value)}
              className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">Category</label>
            {!isCustomCategory ? (
                <select 
                    id="category"
                    value={category} 
                    onChange={handleCategoryChange}
                    className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="new">-- Add New Category --</option>
                </select>
            ) : (
                <input
                    type="text"
                    placeholder="Enter new category name"
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                />
            )}
          </div>
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-1">Tags</label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="e.g., reporting, sales, Q4"
              className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
            />
            <p className="text-xs text-gray-500 mt-1">Separate tags with commas.</p>
          </div>
        </div>
        <div className="p-6 bg-gray-800/50 border-t border-gray-700 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-md text-white bg-cyan-600 hover:bg-cyan-700">Save Document</button>
        </div>
      </div>
    </div>
  );
};
