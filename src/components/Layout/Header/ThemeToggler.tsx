'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

const ThemeToggler = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
          <path d="M12 3.75a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V4.5a.75.75 0 0 1 .75-.75Zm0 14.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75ZM5.23 5.23a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.06L5.23 6.29a.75.75 0 0 1 0-1.06Zm10.48 10.48a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06ZM3.75 12a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5H4.5a.75.75 0 0 1-.75-.75Zm14.5 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75ZM5.23 18.77a.75.75 0 0 1 0-1.06l1.06-1.06a.75.75 0 1 1 1.06 1.06L6.29 18.77a.75.75 0 0 1-1.06 0Zm10.48-10.48a.75.75 0 0 1 0-1.06l1.06-1.06a.75.75 0 1 1 1.06 1.06L17.35 8.29a.75.75 0 0 1-1.06 0Zm-5.73 2.96A3.75 3.75 0 1 1 12 16.75a3.75 3.75 0 0 1-2.98-6.5Z" />
        </svg>
      </button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors duration-200 hover:border-primary/30 hover:text-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
          <path d="M12 2.75a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V3.5a.75.75 0 0 1 .75-.75Zm0 15.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75ZM5.23 5.23a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.06L5.23 6.29a.75.75 0 0 1 0-1.06Zm10.48 10.48a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06ZM3.75 12a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5H4.5a.75.75 0 0 1-.75-.75Zm14.5 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75ZM5.23 18.77a.75.75 0 0 1 0-1.06l1.06-1.06a.75.75 0 1 1 1.06 1.06L6.29 18.77a.75.75 0 0 1-1.06 0Zm10.48-10.48a.75.75 0 0 1 0-1.06l1.06-1.06a.75.75 0 1 1 1.06 1.06L17.35 8.29a.75.75 0 0 1-1.06 0Zm-5.73 2.96A3.75 3.75 0 1 1 12 16.75a3.75 3.75 0 0 1-2.98-6.5Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
          <path d="M20.7 14.84a8.5 8.5 0 0 1-10.54-10.54 8.5 8.5 0 1 0 10.54 10.54Z" />
        </svg>
      )}
    </button>
  );
};

export default ThemeToggler;
