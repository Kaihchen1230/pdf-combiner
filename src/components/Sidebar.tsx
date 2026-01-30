import { useEffect, useState } from 'react';
import { FileStack, Scissors, FileText } from 'lucide-react';
import { useTheme } from 'next-themes';
import { usePdfStore } from '../store/pdfStore';
import { ThemeToggle } from './ThemeToggle';
import type { AppMode } from '../types/pdf';

interface ModeButtonProps {
  mode: AppMode;
  currentMode: AppMode;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function ModeButton({ mode, currentMode, icon, label, onClick }: ModeButtonProps) {
  const isActive = mode === currentMode;

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
        ${isActive
          ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/25'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-600 hover:text-gray-900 dark:hover:text-gray-200'
        }
      `}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

export function Sidebar() {
  const { mode, setMode, pdfFiles } = usePdfStore();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const themeLabel = mounted
    ? theme === 'system'
      ? 'System'
      : theme === 'dark'
      ? 'Dark'
      : 'Light'
    : '';

  return (
    <aside className="w-64 bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-600 flex flex-col">
      {/* Logo / Title */}
      <div className="p-6 border-b border-gray-200 dark:border-dark-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">PDF Combiner</h1>
            <p className="text-xs text-gray-500">Merge & Split PDFs</p>
          </div>
        </div>
      </div>

      {/* Mode Selection */}
      <nav className="flex-1 p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
          Mode
        </p>
        <div className="space-y-2">
          <ModeButton
            mode="merge"
            currentMode={mode}
            icon={<FileStack className="w-5 h-5" />}
            label="Merge PDFs"
            onClick={() => setMode('merge')}
          />
          <ModeButton
            mode="split"
            currentMode={mode}
            icon={<Scissors className="w-5 h-5" />}
            label="Split PDF"
            onClick={() => setMode('split')}
          />
        </div>

        {/* Stats */}
        {pdfFiles.length > 0 && (
          <div className="mt-8 p-4 bg-gray-100 dark:bg-dark-700 rounded-xl">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Current Session
            </p>
            <div className="space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="text-gray-900 dark:text-white font-medium">{pdfFiles.length}</span>{' '}
                {pdfFiles.length === 1 ? 'file' : 'files'} loaded
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="text-gray-900 dark:text-white font-medium">
                  {pdfFiles.reduce((sum, f) => sum + f.selectedPages.length, 0)}
                </span>{' '}
                pages selected
              </p>
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-dark-600">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500">Theme</span>
            {mounted && (
              <span className="ml-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                {themeLabel}
              </span>
            )}
          </div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
