import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Language, UserRole } from '../data/constants.ts';
import { dictionaries, type TranslationDict } from '../i18n/index.ts';
import { apiFetch, setApiAuthToken, setApiCsrfToken } from '../lib/api.ts';

export interface AuthUser {
  id: number;
  email: string;
  mobile: string;
  role: UserRole;
  full_name: string;
  language: Language;
  is_suspended: number;
  created_at: string;
}

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface AppContextValue {
  user: AuthUser | null;
  profile: any;
  authLoading: boolean;
  language: Language;
  t: TranslationDict;
  setLanguage: (lang: Language) => Promise<void>;
  setAuthData: (
    user: AuthUser | null,
    profile: any,
    csrfToken: string | null,
    authToken?: string | null
  ) => void;
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const LANG_STORAGE_KEY = 'kaamconnect_language';

function getInitialLanguage(): Language {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'en' || saved === 'kn' || saved === 'hi') return saved;
  } catch {
    // ignore storage errors
  }
  return 'en';
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4500);
  }, []);

  const setAuthData = useCallback(
    (
      nextUser: AuthUser | null,
      nextProfile: any,
      csrfToken: string | null,
      authToken?: string | null
    ) => {
      setUser(nextUser);
      setProfile(nextProfile);
      setApiCsrfToken(csrfToken);
      if (authToken !== undefined) {
        setApiAuthToken(authToken);
      }
      if (!nextUser) {
        setApiAuthToken(null);
      }
      if (nextUser?.language && ['en', 'kn', 'hi'].includes(nextUser.language)) {
        setLanguageState(nextUser.language);
        try {
          localStorage.setItem(LANG_STORAGE_KEY, nextUser.language);
        } catch {
          // ignore
        }
      }
    },
    []
  );

  const refreshAuth = useCallback(async () => {
    try {
      const data = await apiFetch<{ user: AuthUser | null; profile: any; csrfToken: string | null }>(
        '/api/auth/me'
      );
      if (data.user) {
        setAuthData(data.user, data.profile, data.csrfToken);
      } else {
        setAuthData(null, null, null, null);
      }
    } catch {
      setAuthData(null, null, null, null);
    } finally {
      setAuthLoading(false);
    }
  }, [setAuthData]);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const setLanguage = useCallback(
    async (lang: Language) => {
      setLanguageState(lang);
      try {
        localStorage.setItem(LANG_STORAGE_KEY, lang);
      } catch {
        // ignore
      }
      if (user) {
        try {
          await apiFetch('/api/auth/language', {
            method: 'PATCH',
            body: JSON.stringify({ language: lang }),
          });
          setUser((prev) => (prev ? { ...prev, language: lang } : prev));
        } catch {
          // Non-fatal if background sync fails
        }
      }
    },
    [user]
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setUser(null);
    setProfile(null);
    setApiCsrfToken(null);
    setApiAuthToken(null);
  }, []);

  const t = dictionaries[language];

  return (
    <AppContext.Provider
      value={{
        user,
        profile,
        authLoading,
        language,
        t,
        setLanguage,
        setAuthData,
        refreshAuth,
        logout,
        showToast,
      }}
    >
      {children}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0 pointer-events-none"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-lg border px-4 py-3 text-sm font-medium shadow-lg transition-all ${
                toast.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : toast.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-900'
                  : 'bg-slate-900 border-slate-800 text-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span>{toast.text}</span>
                <button
                  type="button"
                  onClick={() => setToasts((prev) => prev.filter((item) => item.id !== toast.id))}
                  className="text-xs opacity-70 hover:opacity-100 shrink-0"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
