
import React, { useState } from 'react';
import { CompanySettings } from '../types';
import { XIcon, UploadIcon } from './icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: CompanySettings) => void;
  currentSettings: CompanySettings;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentSettings }) => {
  const [logo, setLogo] = useState<string | null>(currentSettings.logo);
  const [details, setDetails] = useState<string>(currentSettings.details);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave({ logo, details });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-30 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Company Settings</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Company Logo</label>
            <div className="mt-2 flex items-center gap-x-4">
              <div className="w-24 h-24 bg-gray-900 rounded-md flex items-center justify-center border border-gray-600">
                {logo ? (
                  <img src={logo} alt="Company Logo" className="max-w-full max-h-full object-contain" />
                ) : (
                  <span className="text-xs text-gray-500">No Logo</span>
                )}
              </div>
              <input type="file" id="logo-upload" className="hidden" accept="image/png, image/jpeg" onChange={handleLogoChange} />
              <label htmlFor="logo-upload" className="cursor-pointer flex items-center px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700 transition-colors">
                <UploadIcon className="h-5 w-5 mr-2" />
                {logo ? 'Change Logo' : 'Upload Logo'}
              </label>
              {logo && (
                <button onClick={() => setLogo(null)} className="text-sm text-red-400 hover:text-red-300">Remove</button>
              )}
            </div>
          </div>
          <div>
            <label htmlFor="company-details" className="block text-sm font-medium text-gray-300 mb-1">Company Details</label>
            <textarea
              id="company-details"
              rows={4}
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="e.g.&#10;Your Company Inc.&#10;123 Main Street&#10;City, State 12345"
              className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
            />
            <p className="text-xs text-gray-500 mt-1">This will appear on your PDF exports.</p>
          </div>
        </div>
        <div className="p-6 bg-gray-800/50 border-t border-gray-700 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-md text-white bg-cyan-600 hover:bg-cyan-700">Save Settings</button>
        </div>
      </div>
    </div>
  );
};
