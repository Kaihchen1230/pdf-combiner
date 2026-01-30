import { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="p-2 rounded-lg bg-gray-100 dark:bg-dark-600 w-10 h-10" />
    );
  }

  const cycleTheme = () => {
    if (theme === 'system') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('system');
    }
  };

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-lg bg-gray-100 dark:bg-dark-600 hover:bg-gray-200 dark:hover:bg-dark-500 transition-colors"
      title={`Current: ${theme} (${resolvedTheme}). Click to cycle themes.`}
    >
      {theme === 'system' ? (
        <Monitor className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      ) : resolvedTheme === 'dark' ? (
        <Sun className="w-5 h-5 text-yellow-400" />
      ) : (
        <Moon className="w-5 h-5 text-indigo-500" />
      )}
    </button>
  );
}
