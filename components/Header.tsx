
import React from 'react';
import { FileTextIcon, SettingsIcon } from './icons';

interface HeaderProps {
    children?: React.ReactNode;
    onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ children, onOpenSettings }) => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-20">
      <div className="container mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {children}
          <div className="flex items-center space-x-3 ml-3">
            <FileTextIcon className="h-8 w-8 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Process Documenter AI
            </h1>
          </div>
        </div>
        <div className="flex items-center space-x-4">
            <p className="hidden md:block text-gray-400">
            Transforming descriptions into documentation.
            </p>
            <button 
                onClick={onOpenSettings} 
                className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                aria-label="Open company settings"
            >
                <SettingsIcon className="h-6 w-6" />
            </button>
        </div>
      </div>
    </header>
  );
};
