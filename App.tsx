
import React, { useState, useCallback, useMemo } from 'react';
import { generateDocumentation } from './services/geminiService';
import { Header } from './components/Header';
import { ProcessInput } from './components/ProcessInput';
import { DocumentationOutput } from './components/DocumentationOutput';
import { AlertTriangle, MenuIcon, XIcon } from './components/icons';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Document, CompanySettings } from './types';
import { SaveDocumentModal } from './components/SaveDocumentModal';
import { Sidebar } from './components/Sidebar';
import { ConfirmationModal } from './components/ConfirmationModal';
import { SettingsModal } from './components/SettingsModal';

interface GenerationResult {
  title: string;
  documentation: string;
}

const App: React.FC = () => {
  const [rawText, setRawText, rawTextSaveStatus] = useLocalStorage<string>('rawTextDraft', '');
  const [screenshots, setScreenshots] = useLocalStorage<string[]>('screenshotsDraft', []);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [editedTitle, setEditedTitle] = useState<string>('');
  const [editedDocumentation, setEditedDocumentation] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [language, setLanguage] = useState<'it' | 'en'>('it');
  
  const [documents, setDocuments] = useLocalStorage<Document[]>('documents', []);
  const [categories, setCategories] = useLocalStorage<string[]>('categories', ['General']);
  const [tags, setTags] = useLocalStorage<string[]>('tags', []);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  
  const [deleteConfirmState, setDeleteConfirmState] = useState<{isOpen: boolean; docId: string | null}>({ isOpen: false, docId: null });

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [companySettings, setCompanySettings] = useLocalStorage<CompanySettings>('companySettings', {
    logo: null,
    details: '',
  });

  const filteredDocuments = useMemo(() => {
    return documents
      .filter(doc => 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        doc.rawText.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(doc => selectedCategory === 'all' || doc.category === selectedCategory)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [documents, searchTerm, selectedCategory]);

  const handleDocumentProcess = useCallback(async () => {
    if (!rawText.trim()) {
      setError('Please enter a description of the process first.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setGenerationResult(null);

    try {
      const result = await generateDocumentation(rawText, screenshots, language);
      setGenerationResult(result);
      setEditedTitle(result.title);
      setEditedDocumentation(result.documentation);
    } catch (err) {
      console.error(err);
      setError('Failed to generate documentation. Please check your connection or API key and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [rawText, screenshots, language]);

  const handleCaptureScreenshot = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const videoTrack = stream.getVideoTracks()[0];
      const imageCapture = new (window as any).ImageCapture(videoTrack);
      const bitmap = await imageCapture.grabFrame();
      videoTrack.stop();

      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d');
      context?.drawImage(bitmap, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      setScreenshots(prev => [...prev, dataUrl]);
    } catch (err) {
      console.error("Error capturing screen:", err);
      setError("Failed to capture screenshot. Please grant permission and try again.");
    }
  }, [setScreenshots]);

  const handleRemoveScreenshot = useCallback((index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  }, [setScreenshots]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (!content) {
          setError('Failed to read file content.');
          return;
        }

        try {
          let processedText = '';

          // Check for HTML/MHTML content by extension or mime type
          if (file.type.includes('html') || /\.mht(ml)?$/.test(file.name)) {
            console.log("HTML/MHTML file detected, attempting to extract text...");

            let htmlToParse = content;

            // Simple MHT parser: MHT files from Steps Recorder are multipart files,
            // but we only want the HTML part. A full parser is complex, so we use
            // a heuristic to extract just the content between the <html> tags.
            // This effectively strips MIME headers and other parts (like base64 images).
            const htmlStartIndex = content.indexOf('<html');
            const htmlEndIndex = content.lastIndexOf('</html>');
            if (htmlStartIndex > -1 && htmlEndIndex > -1 && htmlEndIndex > htmlStartIndex) {
              htmlToParse = content.substring(htmlStartIndex, htmlEndIndex + '</html>'.length);
            }

            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlToParse, "text/html");

            // Remove script and style elements to avoid including irrelevant code
            doc.querySelectorAll('script, style').forEach(el => el.remove());
            
            // Use innerText on the body to get the human-readable text
            const extractedText = doc.body?.innerText || '';

            // Clean up excessive newlines that might result from parsing
            processedText = extractedText.replace(/(\r\n|\n|\r){3,}/g, '\n\n').trim();
            
            if (processedText.length === 0) {
                 setError("Could not extract meaningful text from the file. It might be empty or in an unsupported format.");
                 return;
            }
          } else {
            // For plain text files, just use the content as is.
            processedText = content;
          }
          
          if (processedText.length > 0) {
            setRawText(prev => prev ? `${prev}\n\n${processedText}` : processedText);
            setError(null);
          }

        } catch (parseError) {
          console.error("Error parsing or reading file:", parseError);
          setError('Failed to process file. It may be corrupt or in an unsupported format.');
        }
      };
      reader.onerror = () => {
        setError('Error reading file.');
      };
      reader.readAsText(file);
    }
    // Reset file input to allow uploading the same file again
    if (event.target) {
        event.target.value = '';
    }
  }, [setRawText]);

  const handleSaveDocument = (title: string, category: string, newTags: string[]) => {
    if (!generationResult) return;

    const newDoc: Document = {
      id: crypto.randomUUID(),
      title,
      category,
      tags: newTags,
      rawText,
      documentedText: editedDocumentation,
      screenshots,
      createdAt: Date.now(),
    };
    setDocuments(prev => [newDoc, ...prev]);

    if (!categories.includes(category)) {
      setCategories(prev => [...prev, category]);
    }
    
    const unseenTags = newTags.filter(t => !tags.includes(t));
    if (unseenTags.length > 0) {
      setTags(prev => [...prev, ...unseenTags]);
    }

    setIsSaveModalOpen(false);
  };
  
  const loadDocument = (doc: Document) => {
      setCurrentDocumentId(doc.id);
      setRawText(doc.rawText);
      setScreenshots(doc.screenshots);
      setGenerationResult({ title: doc.title, documentation: doc.documentedText });
      setEditedTitle(doc.title);
      setEditedDocumentation(doc.documentedText);
  };
  
  const createNewDocument = () => {
      setCurrentDocumentId(null);
      setRawText('');
      setScreenshots([]);
      setGenerationResult(null);
      setError(null);
      setEditedTitle('');
      setEditedDocumentation('');
  };

  const deleteDocument = (id: string) => {
      setDocuments(docs => docs.filter(d => d.id !== id));
      if (currentDocumentId === id) {
        createNewDocument();
      }
  };

  const handleInitiateDelete = (id: string) => {
    setDeleteConfirmState({ isOpen: true, docId: id });
  };
  
  const handleConfirmDelete = () => {
    if (deleteConfirmState.docId) {
      deleteDocument(deleteConfirmState.docId);
    }
    setDeleteConfirmState({ isOpen: false, docId: null });
  };
  
  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmState({ isOpen: false, docId: null });
  };

  const handleSaveSettings = (newSettings: CompanySettings) => {
    setCompanySettings(newSettings);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      <Header onOpenSettings={() => setIsSettingsModalOpen(true)}>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500">
          {isSidebarOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
        </button>
      </Header>
      <div className="flex flex-grow overflow-hidden">
        <Sidebar 
          isOpen={isSidebarOpen}
          documents={filteredDocuments}
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectedCategoryChanged={setSelectedCategory}
          onSearchChanged={setSearchTerm}
          onLoadDocument={loadDocument}
          onNewDocument={createNewDocument}
          onDeleteDocument={handleInitiateDelete}
        />
        <main className="flex-grow p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start overflow-y-auto">
          <ProcessInput
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            onSubmit={handleDocumentProcess}
            isLoading={isLoading}
            onCaptureScreenshot={handleCaptureScreenshot}
            screenshots={screenshots}
            onRemoveScreenshot={handleRemoveScreenshot}
            onFileChange={handleFileChange}
            language={language}
            onLanguageChange={setLanguage}
            saveStatus={rawTextSaveStatus}
          />
          <DocumentationOutput
            title={editedTitle}
            documentation={editedDocumentation}
            onTitleChange={setEditedTitle}
            onDocumentationChange={setEditedDocumentation}
            screenshots={screenshots}
            isLoading={isLoading}
            onSave={() => setIsSaveModalOpen(true)}
            companySettings={companySettings}
          />
        </main>
      </div>
      {isSaveModalOpen && generationResult && (
        <SaveDocumentModal
          title={editedTitle}
          categories={categories}
          existingTags={tags}
          onSave={handleSaveDocument}
          onClose={() => setIsSaveModalOpen(false)}
        />
      )}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={handleSaveSettings}
        currentSettings={companySettings}
      />
      {deleteConfirmState.isOpen && (
        <ConfirmationModal
          isOpen={deleteConfirmState.isOpen}
          onClose={handleCloseDeleteConfirm}
          onConfirm={handleConfirmDelete}
          title="Delete Document"
          message="Are you sure you want to permanently delete this document? This action cannot be undone."
          confirmButtonText="Yes, Delete"
        />
      )}
      {error && (
        <div 
          className="fixed bottom-8 right-8 bg-red-500 text-white p-4 rounded-lg shadow-lg flex items-center cursor-pointer"
          onClick={() => setError(null)}
        >
          <AlertTriangle className="h-6 w-6 mr-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default App;
