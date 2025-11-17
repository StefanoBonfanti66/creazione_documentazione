
import React, { useRef } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { CameraIcon, XIcon, UploadIcon, CheckIcon } from './icons';

interface ProcessInputProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  isLoading: boolean;
  onCaptureScreenshot: () => void;
  screenshots: string[];
  onRemoveScreenshot: (index: number) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  language: 'it' | 'en';
  onLanguageChange: (lang: 'it' | 'en') => void;
  saveStatus: 'saving' | 'saved';
}

export const ProcessInput: React.FC<ProcessInputProps> = ({ 
    value, 
    onChange, 
    onSubmit, 
    isLoading, 
    onCaptureScreenshot, 
    screenshots, 
    onRemoveScreenshot, 
    onFileChange,
    language,
    onLanguageChange,
    saveStatus
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const getButtonClasses = (lang: 'it' | 'en') => {
    const baseClasses = "px-4 py-2 rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500";
    if (language === lang) {
      return `${baseClasses} bg-cyan-600 text-white`;
    }
    return `${baseClasses} bg-gray-700 text-gray-300 hover:bg-gray-600`;
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-2xl p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">1. Describe Your Process</h2>
        <div className="text-sm text-gray-400 transition-opacity duration-300 h-5">
            {saveStatus === 'saving' && (
                <span className="flex items-center">
                <LoadingSpinner className="h-4 w-4 mr-2" /> Saving...
                </span>
            )}
            {saveStatus === 'saved' && value.trim() && (
                <span className="flex items-center text-green-400">
                <CheckIcon className="h-5 w-5 mr-1" /> Saved
                </span>
            )}
        </div>
      </div>
      <p className="text-gray-400 mb-4">
        Write down the steps, import a file from a tool like Windows' Steps Recorder, or combine both. Add screenshots for more accuracy.
      </p>
      <textarea
        value={value}
        onChange={onChange}
        placeholder="e.g., First, I open the spreadsheet... then I filter for 'Q4'..."
        className="flex-grow w-full p-4 bg-gray-900 border border-gray-700 rounded-md text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-shadow duration-300 resize-none min-h-[250px]"
        disabled={isLoading}
      />

      <div className="mt-4">
        <input
            type="file"
            ref={fileInputRef}
            onChange={onFileChange}
            className="hidden"
            accept=".txt,.mht,.mhtml,.html"
        />
        <button
            onClick={handleImportClick}
            disabled={isLoading}
            className="w-full flex justify-center items-center px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700 disabled:cursor-not-allowed transition-colors"
        >
            <UploadIcon className="h-5 w-5 mr-2" />
            Import from file
        </button>
        <p className="text-xs text-gray-500 mt-1">Note: Images from files are not automatically imported.</p>
      </div>

      <div className="mt-4">
          <h3 className="text-lg font-medium text-gray-300 mb-2">Language</h3>
          <div className="flex space-x-2">
              <button
                  onClick={() => onLanguageChange('it')}
                  className={getButtonClasses('it')}
              >
                  Italiano
              </button>
              <button
                  onClick={() => onLanguageChange('en')}
                  className={getButtonClasses('en')}
              >
                  English
              </button>
          </div>
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-medium text-gray-300 mb-2">Screenshots</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {screenshots.map((src, index) => (
                <div key={index} className="relative group">
                    <img src={src} alt={`Screenshot ${index + 1}`} className="rounded-md object-cover aspect-video"/>
                    <button 
                        onClick={() => onRemoveScreenshot(index)}
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove screenshot"
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
            ))}
            <button
            onClick={onCaptureScreenshot}
            disabled={isLoading}
            className="flex flex-col justify-center items-center px-4 py-2 border-2 border-dashed border-gray-600 rounded-md text-gray-400 hover:bg-gray-700/50 hover:border-cyan-500 hover:text-cyan-400 disabled:cursor-not-allowed transition-colors duration-300 aspect-video"
            >
            <CameraIcon className="h-8 w-8 mb-1" />
            <span className="text-sm">Add Screenshot</span>
            </button>
        </div>
      </div>
      <button
        onClick={onSubmit}
        disabled={isLoading || !value.trim()}
        className="mt-6 w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300"
      >
        {isLoading ? (
          <>
            <LoadingSpinner className="-ml-1 mr-3 h-5 w-5 text-white" />
            Generating...
          </>
        ) : (
          'Generate Documentation'
        )}
      </button>
    </div>
  );
};