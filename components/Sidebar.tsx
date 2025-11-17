import React from 'react';
import { Document } from '../types';
import { FileTextIcon, TagIcon, TrashIcon } from './icons';

interface SidebarProps {
  isOpen: boolean;
  documents: Document[];
  categories: string[];
  selectedCategory: string;
  onSelectedCategoryChanged: (category: string) => void;
  onSearchChanged: (term: string) => void;
  onLoadDocument: (doc: Document) => void;
  onNewDocument: () => void;
  onDeleteDocument: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
    isOpen, 
    documents,
    categories,
    selectedCategory,
    onSelectedCategoryChanged,
    onSearchChanged,
    onLoadDocument,
    onNewDocument,
    onDeleteDocument,
}) => {
  if (!isOpen) {
    return null;
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // The parent component will now handle the confirmation logic.
    onDeleteDocument(id);
  };

  return (
    <aside className="w-full md:w-1/3 lg:w-1/4 bg-gray-800 border-r border-gray-700 flex flex-col p-4 overflow-y-auto transition-all duration-300">
      <div className="flex-shrink-0">
        <h2 className="text-xl font-semibold mb-4">My Documents</h2>
        <button onClick={onNewDocument} className="w-full mb-4 px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors">
            + New Document
        </button>
        <input
          type="text"
          placeholder="Search documents..."
          onChange={e => onSearchChanged(e.target.value)}
          className="w-full p-2 mb-4 bg-gray-900 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
        />
        <select
            value={selectedCategory}
            onChange={e => onSelectedCategoryChanged(e.target.value)}
            className="w-full p-2 mb-4 bg-gray-900 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      <div className="flex-grow overflow-y-auto -mr-4 pr-4">
        {documents.length === 0 ? (
            <p className="text-gray-500 text-center mt-8">No documents found.</p>
        ) : (
        <ul className="space-y-2">
          {documents.map(doc => (
            <li key={doc.id} onClick={() => onLoadDocument(doc)} className="group bg-gray-900 p-3 rounded-md cursor-pointer hover:bg-gray-700/50 transition-colors relative">
              <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-gray-200 truncate pr-8">{doc.title}</h3>
                  <button onClick={(e) => handleDelete(e, doc.id)} className="absolute top-2 right-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity z-10 p-1">
                      <TrashIcon className="w-4 h-4"/>
                  </button>
              </div>
              <p className="text-sm text-gray-400">{doc.category}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {doc.tags.map(tag => (
                  <span key={tag} className="flex items-center text-xs bg-gray-700 text-cyan-300 px-2 py-1 rounded-full">
                    <TagIcon className="w-3 h-3 mr-1" /> {tag}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
        )}
      </div>
    </aside>
  );
};