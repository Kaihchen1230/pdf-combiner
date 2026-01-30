import { Loader2, AlertCircle, X } from 'lucide-react';
import { Sidebar, DropZone, PdfList, ActionBar } from './components';
import { usePdfStore } from './store/pdfStore';

function App() {
  const { pdfFiles, mode, isLoading, error, setError } = usePdfStore();

  const hasFiles = pdfFiles.length > 0;

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-dark-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-600 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {mode === 'merge' ? 'Merge PDFs' : 'Split PDF'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {mode === 'merge'
              ? 'Combine multiple PDF files into one document'
              : 'Extract specific pages from a PDF file'}
          </p>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-300 flex-1">{error}</p>
              <button
                onClick={() => setError(null)}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-red-500 dark:text-red-400" />
              </button>
            </div>
          )}

          {/* Loading Overlay */}
          {isLoading && (
            <div className="mb-4 p-4 bg-indigo-50 dark:bg-accent-primary/10 border border-indigo-200 dark:border-accent-primary/30 rounded-xl flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-accent-primary animate-spin" />
              <p className="text-sm text-accent-primary">Loading PDF files...</p>
            </div>
          )}

          {/* Drop Zone - show when no files or in merge mode */}
          {(!hasFiles || (mode === 'merge' && pdfFiles.length < 10)) && (
            <div className="mb-6">
              <DropZone />
            </div>
          )}

          {/* PDF List */}
          {hasFiles && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                  {mode === 'merge' ? 'Files to Merge' : 'Selected File'}
                </h3>
                {mode === 'merge' && (
                  <p className="text-sm text-gray-500">
                    Drag to reorder - Click to expand and select pages
                  </p>
                )}
              </div>
              <PdfList />
            </div>
          )}

          {/* Empty State for Split Mode */}
          {!hasFiles && mode === 'split' && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                Drop a PDF file above to get started with splitting
              </p>
            </div>
          )}
        </main>

        {/* Action Bar */}
        <ActionBar />
      </div>
    </div>
  );
}

export default App;
