import { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, isVisible, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 animate-slide-up">
      <div className="flex items-center gap-3 bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg shadow-green-500/25">
        <CheckCircle className="w-5 h-5 flex-shrink-0" />
        <p className="font-medium">{message}</p>
        <button
          onClick={onClose}
          className="p-1 hover:bg-green-600 rounded-lg transition-colors ml-2"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
