'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';

const storageKey = 'olive-oil-theme';
const changeEvent = 'olive-oil-theme-change';

function getThemeSnapshot(): Theme {
  if (document.documentElement.dataset.theme === 'dark') return 'dark';
  if (document.documentElement.dataset.theme === 'light') return 'light';
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // Use the device preference when browser storage is unavailable.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function subscribeToTheme(callback: () => void) {
  window.addEventListener(changeEvent, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(changeEvent, callback);
    window.removeEventListener('storage', callback);
  };
}

function getServerThemeSnapshot(): Theme {
  return 'light';
}

export function ThemeToggle({ locale = 'ar', className = '' }: { locale?: 'ar' | 'en'; className?: string }) {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);
  const english = locale === 'en';

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(storageKey);
    } catch {
      // Use the device preference when browser storage is unavailable.
    }
    const initial: Theme = saved === 'dark' || saved === 'light'
      ? saved
      : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.dataset.theme = initial;
  }, []);

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem(storageKey, next);
    } catch {
      // The current page still changes theme when browser storage is unavailable.
    }
    window.dispatchEvent(new Event(changeEvent));
  }

  const label = theme === 'dark'
    ? (english ? 'Switch to light mode' : 'التبديل إلى الوضع الفاتح')
    : (english ? 'Switch to dark mode' : 'التبديل إلى الوضع الداكن');
  const Icon = theme === 'dark' ? Sun : Moon;

  return (
    <button
      type='button'
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={theme === 'dark'}
      title={label}
      className={'grid size-11 shrink-0 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--olive-800)] transition-colors hover:bg-[var(--olive-100)] ' + className}
    >
      <Icon size={19} aria-hidden='true' />
    </button>
  );
}
