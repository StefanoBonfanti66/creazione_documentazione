import React, { useRef, useState } from 'react';
import { SaveIcon } from './icons';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { ExportMenu } from './ExportMenu';
import { ConfirmationModal } from './ConfirmationModal';

interface DocumentationOutputProps {
  title: string;
  documentation: string;
  onTitleChange: (newTitle: string) => void;
  onDocumentationChange: (newDoc: string) => void;
  screenshots: string[];
  isLoading: boolean;
  onSave: () => void;
}

const parseMarkdown = (text: string) => {
  const lines = text.split('\n');
  let inList = false;
  const elements = lines.map((line, index) => {
    if (line.startsWith('## ')) {
      return <h2 key={index} className="text-2xl font-bold text-white mt-4 mb-3">{line.substring(3)}</h2>;
    }
    if (line.match(/^\d+\./)) {
      const li = <li key={index} className="mb-2">{renderStyledText(line.replace(/^\d+\.\s*/, ''))}</li>;
      if (!inList) {
          inList = true;
          return <ol key={`list-${index}`} className="list-decimal list-inside space-y-2 text-gray-300">{li}</ol>
      }
      return li;
    }
    if (inList) {
        // Closing the list if a non-list item is found
        inList = false;
    }
    if (line.trim() === '') {
        return null; // Don't render empty lines as paragraphs
    }
    return <p key={index} className="text-gray-300 mb-2">{renderStyledText(line)}</p>;
  });

  // This is a bit of a hack to group list items correctly.
  const groupedElements = [];
  let currentList = null;
  for (const el of elements) {
      if(el?.type === 'ol') {
          if(currentList) groupedElements.push(currentList);
          currentList = React.cloneElement(el, {children: [el.props.children]});
      } else if (el?.type === 'li' && currentList) {
          currentList.props.children.push(el);
      } else {
          if(currentList) groupedElements.push(currentList);
          currentList = null;
          groupedElements.push(el);
      }
  }
  if(currentList) groupedElements.push(currentList);

  return groupedElements;
};

const renderStyledText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
        <>
            {parts.map((part, i) =>
            part.startsWith('**') && part.endsWith('**') ? (
                <strong key={i} className="font-semibold text-cyan-300">{part.slice(2, -2)}</strong>
            ) : (
                part
            )
            )}
        </>
    );
}


export const DocumentationOutput: React.FC<DocumentationOutputProps> = ({ 
    title, 
    documentation, 
    onTitleChange, 
    onDocumentationChange, 
    screenshots, 
    isLoading, 
    onSave 
}) => {
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [confirmModalState, setConfirmModalState] = useState<{isOpen: boolean; type: 'pdf' | 'txt' | null}>({ isOpen: false, type: null });

  const hasContent = !isLoading && title;

  const createFileName = (extension: string) => {
    const docTitle = title || 'Untitled';
    return `${docTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;
  };

  const handleExportPDF = async () => {
    if (!contentRef.current || !title) return;
    setIsExporting(true);

    // Create a clone of the content to be styled for printing
    const contentToPrint = contentRef.current.cloneNode(true) as HTMLElement;

    // Create a wrapper that will be rendered by html2canvas
    const printWrapper = document.createElement('div');
    printWrapper.style.position = 'absolute';
    printWrapper.style.left = '-9999px'; // Position off-screen
    printWrapper.style.top = '0';
    printWrapper.style.background = 'white';
    printWrapper.style.fontFamily = 'Arial, sans-serif';
    printWrapper.style.lineHeight = '1.6';
    
    // Set a fixed width similar to A4 and add padding for margins
    printWrapper.style.width = '210mm'; 
    printWrapper.style.padding = '20mm'; // This creates the document margins
    printWrapper.style.boxSizing = 'border-box';
    
    // Reset and apply print-friendly styles to the cloned content
    printWrapper.style.color = '#000';
    contentToPrint.style.color = 'inherit';
    contentToPrint.querySelectorAll('*').forEach((el: HTMLElement) => {
        el.style.color = 'inherit';
        el.style.background = 'transparent';
    });
    contentToPrint.querySelectorAll('h1').forEach(h => { h.style.fontSize = '22pt'; h.style.fontWeight = 'bold'; h.style.marginTop = '0'; });
    contentToPrint.querySelectorAll('h2').forEach(h => { h.style.fontSize = '18pt'; h.style.fontWeight = 'bold'; });
    contentToPrint.querySelectorAll('h3').forEach(h => { h.style.fontSize = '14pt'; h.style.fontWeight = 'bold'; });
    contentToPrint.querySelectorAll('p, li').forEach((el: HTMLElement) => { el.style.fontSize = '12pt'; });
    contentToPrint.querySelectorAll('strong').forEach((s: HTMLElement) => { s.style.fontWeight = 'bold'; });
    contentToPrint.querySelectorAll('img').forEach((img: HTMLImageElement) => {
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.border = '1px solid #ddd';
        img.style.borderRadius = '4px';
        img.style.marginTop = '1em';
        img.style.marginBottom = '1em';
    });

    printWrapper.appendChild(contentToPrint);
    document.body.appendChild(printWrapper);
    
    try {
        const canvas = await html2canvas(printWrapper, {
            scale: 2, // Higher resolution for better text quality
            useCORS: true,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // Calculate the height of the image in the PDF, maintaining aspect ratio
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        // Add the first page
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        // Add subsequent pages if the content is too long
        while (heightLeft > 0) {
            position -= pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        pdf.save(createFileName('pdf'));

    } catch (error) {
        console.error("Failed to generate PDF:", error);
    } finally {
        // Clean up the temporary element from the DOM
        document.body.removeChild(printWrapper);
        setIsExporting(false);
    }
  };

  const handleExportTXT = () => {
    if (!title) return;
    
    const content = `${title}\n\n${"-".repeat(title.length)}\n\n${documentation}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = createFileName('txt');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleInitiateExport = (type: 'pdf' | 'txt') => {
    setConfirmModalState({ isOpen: true, type });
  };

  const handleConfirmExport = async () => {
    if (confirmModalState.type === 'pdf') {
      await handleExportPDF();
    } else if (confirmModalState.type === 'txt') {
      handleExportTXT();
    }
    setConfirmModalState({ isOpen: false, type: null });
  };

  const handleCloseConfirmModal = () => {
    setConfirmModalState({ isOpen: false, type: null });
  };

  const getTabClasses = (mode: 'preview' | 'edit') => {
    const base = "px-4 py-2 font-medium text-sm rounded-t-md transition-colors duration-200 focus:outline-none";
    if (viewMode === mode) {
      return `${base} text-white bg-gray-900 border-gray-700 border-t border-l border-r`;
    }
    return `${base} text-gray-400 hover:text-white hover:bg-gray-700/50`;
  };


  return (
    <>
      <div className="bg-gray-800 rounded-lg shadow-2xl p-6 min-h-[500px] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">2. Generated Documentation</h2>
          {hasContent && (
              <div className="flex items-center space-x-2">
                  <ExportMenu 
                    onExport={handleInitiateExport} 
                    isExporting={isExporting}
                    pdfDisabled={viewMode === 'edit'}
                  />
                  <button onClick={onSave} className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500">
                      <SaveIcon className="h-5 w-5 mr-2" />
                      Save
                  </button>
              </div>
          )}
        </div>
        
        {hasContent && (
          <div className="flex border-b border-gray-700 -mx-6 px-6">
            <button onClick={() => setViewMode('preview')} className={getTabClasses('preview')}>
              Preview
            </button>
            <button onClick={() => setViewMode('edit')} className={getTabClasses('edit')}>
              Edit
            </button>
          </div>
        )}

        <div className="flex-grow w-full bg-gray-900 border-x border-b border-gray-700 rounded-b-md overflow-y-auto">
          {(isLoading || isExporting) && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-400">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                <p>{isExporting ? 'Generating PDF...' : 'AI is documenting your process...'}</p>
              </div>
            </div>
          )}
          {!isLoading && !isExporting && !hasContent && (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Your professional documentation will appear here.</p>
            </div>
          )}
          {hasContent && !isExporting && (
            viewMode === 'preview' ? (
                <div ref={contentRef} className="p-4">
                    <article className="prose prose-invert max-w-none">
                        <h1 className="text-3xl font-bold text-white mb-4">{title}</h1>
                        {parseMarkdown(documentation)}
                        {screenshots.length > 0 && (
                            <>
                                <h3 className="text-xl font-semibold text-white mt-6 mb-3">Associated Screenshots</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {screenshots.map((src, i) => (
                                        <img key={i} src={src} alt={`Screenshot ${i+1}`} className="rounded-md border border-gray-600"/>
                                    ))}
                                </div>
                            </>
                        )}
                    </article>
                </div>
            ) : (
                <div className="p-4 flex flex-col h-full space-y-4">
                    <div>
                        <label htmlFor="doc-title" className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                        <input
                        id="doc-title"
                        type="text"
                        value={title}
                        onChange={(e) => onTitleChange(e.target.value)}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white text-xl font-bold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        />
                    </div>
                    <div className="flex-grow flex flex-col">
                        <label htmlFor="doc-content" className="block text-sm font-medium text-gray-400 mb-1">Content (Markdown)</label>
                        <textarea
                        id="doc-content"
                        value={documentation}
                        onChange={(e) => onDocumentationChange(e.target.value)}
                        className="flex-grow w-full p-4 bg-gray-700 border border-gray-600 rounded-md resize-none font-mono text-sm text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 min-h-[400px]"
                        />
                    </div>
                </div>
            )
          )}
        </div>
      </div>
      <ConfirmationModal 
        isOpen={confirmModalState.isOpen}
        onClose={handleCloseConfirmModal}
        onConfirm={handleConfirmExport}
        title="Confirm Export"
        message={`Are you sure you want to export this document as a ${confirmModalState.type?.toUpperCase()} file?`}
        confirmButtonText="Yes, Export"
      />
    </>
  );
};