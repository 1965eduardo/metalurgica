import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { DEFAULT_SITE_CONTENT } from '../data/initialData';

interface ContentContextType {
  content: Record<string, string>;
  loading: boolean;
  updateContent: (id: string, newContent: string) => Promise<void>;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

const getInitialContent = (): Record<string, string> => {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('site_content_cache');
      if (cached) {
        return { ...DEFAULT_SITE_CONTENT, ...JSON.parse(cached) };
      }
    } catch (e) {
      // ignore
    }
  }
  return { ...DEFAULT_SITE_CONTENT };
};

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<Record<string, string>>(getInitialContent);
  const [loading, setLoading] = useState(false);
  const { authToken } = useAuth();

  const applyTheme = useCallback((themeStr?: string) => {
    if (themeStr) {
      try {
        const theme = JSON.parse(themeStr);
        if (theme.primary) {
          document.documentElement.style.setProperty('--theme-primary', theme.primary);
          document.documentElement.style.setProperty('--bg-pill-active', theme.primary);
        }
        if (theme.text_main) document.documentElement.style.setProperty('--theme-title', theme.text_main);
        if (theme.text_muted) document.documentElement.style.setProperty('--theme-body', theme.text_muted);
        if (theme.bg_main) document.documentElement.style.setProperty('--theme-bg', theme.bg_main);
        if (theme.bg_card) document.documentElement.style.setProperty('--theme-card', theme.bg_card);
        if (theme.bg_nav) document.documentElement.style.setProperty('--theme-nav', theme.bg_nav);
        return;
      } catch (e) {
        console.error('Erro ao parsear tema:', e);
      }
    }
    // Caso padrão
    document.documentElement.style.setProperty('--theme-primary', '#B82020');
    document.documentElement.style.setProperty('--bg-pill-active', '#B82020');
  }, []);

  const fetchContent = useCallback(async () => {
    try {
      const res = await fetch('/api/content');
      if (res.ok) {
        const data = await res.json();
        const merged = { ...DEFAULT_SITE_CONTENT, ...data };
        setContent(merged);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('site_content_cache', JSON.stringify(merged));
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar conteúdo:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  useEffect(() => {
    applyTheme(content['site_theme']);
  }, [content, applyTheme]);

  const updateContent = async (id: string, newContent: string) => {
    if (!authToken) throw new Error('Não autorizado');
    
    // Optimistic update
    setContent(prev => {
      const updated = { ...prev, [id]: newContent };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('site_content_cache', JSON.stringify(updated));
        } catch (e) {
          // ignore
        }
      }
      return updated;
    });

    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ id, content: newContent }),
      });

      if (!res.ok) {
        throw new Error('Falha ao salvar conteúdo');
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  return (
    <ContentContext.Provider value={{ content, loading, updateContent }}>
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => {
  const context = useContext(ContentContext);
  if (context === undefined) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};
