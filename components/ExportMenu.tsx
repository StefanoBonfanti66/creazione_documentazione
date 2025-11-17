import React, { useState, useRef, useEffect } from 'react';
import { ExportIcon } from './icons';
import { LoadingSpinner } from './LoadingSpinner';

interface ExportMenuProps {
  onExport: (type: 'pdf' | 'txt') => void;
  isExporting: boolean;
  pdfDisabled?: boolean;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ onExport, isExporting, pdfDisabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (type: 'pdf' | 'txt') => {
    setIsOpen(false);
    onExport(type);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 disabled:opacity-50"
      >
        {isExporting ? <LoadingSpinner /> : <ExportIcon className="h-5 w-5 mr-2" />}
        {isExporting ? 'Exporting...' : 'Export'}
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            <button
              onClick={() => handleSelect('pdf')}
              className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              role="menuitem"
              disabled={pdfDisabled}
            >
              Export as PDF
              {pdfDisabled && <span className="text-xs text-gray-500 ml-2">(Preview only)</span>}
            </button>
            <button
              onClick={() => handleSelect('txt')}
              className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
              role="menuitem"
            >
              Export as TXT
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
