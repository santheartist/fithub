/**
 * Paper/Feed context for managing paper state across the app
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';

export interface Paper {
  id: number;
  title: string;
  authors: string;
  journal_name?: string;
  category: string;
  ai_summary?: string;
  paper_url: string;
  likes_count: number;
  comments_count: number;
  is_liked_by_user: boolean;
  is_saved_by_user: boolean;
  is_reposted_by_user: boolean;
  tags: any[];
}

interface PaperContextType {
  papers: Paper[];
  loading: boolean;
  total: number;
  currentCategory: string | null;
  loadPapers: (skip?: number, limit?: number, category?: string) => Promise<void>;
  searchPapers: (query: string, category?: string) => Promise<void>;
  toggleLike: (paperId: number, isLiked: boolean) => Promise<void>;
  toggleSave: (paperId: number, isSaved: boolean) => Promise<void>;
  toggleRepost: (paperId: number, isReposted: boolean) => Promise<void>;
}

const PaperContext = createContext<PaperContextType | undefined>(undefined);

export const PaperProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);

  const loadPapers = useCallback(async (skip = 0, limit = 20, category?: string) => {
    setLoading(true);
    try {
      const response = await apiClient.getPapersFeed(skip, limit, category);
      setPapers(response.data.items);
      setTotal(response.data.total);
      if (category) setCurrentCategory(category);
    } catch (error) {
      console.error('Failed to load papers', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchPapers = useCallback(async (query: string, category?: string) => {
    setLoading(true);
    try {
      const response = await apiClient.searchPapers(query, category);
      setPapers(response.data.items);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to search papers', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleLike = useCallback(async (paperId: number, isLiked: boolean) => {
    try {
      if (isLiked) {
        await apiClient.unlikePaper(paperId);
      } else {
        await apiClient.likePaper(paperId);
      }
      
      // Update local state
      setPapers(papers.map(p => 
        p.id === paperId 
          ? {
              ...p,
              is_liked_by_user: !isLiked,
              likes_count: isLiked ? p.likes_count - 1 : p.likes_count + 1
            }
          : p
      ));
    } catch (error) {
      console.error('Failed to toggle like', error);
    }
  }, [papers]);

  const toggleSave = useCallback(async (paperId: number, isSaved: boolean) => {
    try {
      if (isSaved) {
        await apiClient.unsavePaper(paperId);
      } else {
        await apiClient.savePaper(paperId);
      }
      
      setPapers(papers.map(p =>
        p.id === paperId ? { ...p, is_saved_by_user: !isSaved } : p
      ));
    } catch (error) {
      console.error('Failed to toggle save', error);
    }
  }, [papers]);

  const toggleRepost = useCallback(async (paperId: number, isReposted: boolean) => {
    try {
      if (isReposted) {
        await apiClient.unrepostPaper(paperId);
      } else {
        await apiClient.repostPaper(paperId);
      }
      
      setPapers(papers.map(p =>
        p.id === paperId ? { ...p, is_reposted_by_user: !isReposted } : p
      ));
    } catch (error) {
      console.error('Failed to toggle repost', error);
    }
  }, [papers]);

  return (
    <PaperContext.Provider
      value={{
        papers,
        loading,
        total,
        currentCategory,
        loadPapers,
        searchPapers,
        toggleLike,
        toggleSave,
        toggleRepost,
      }}
    >
      {children}
    </PaperContext.Provider>
  );
};

export const usePapers = () => {
  const context = useContext(PaperContext);
  if (!context) {
    throw new Error('usePapers must be used within PaperProvider');
  }
  return context;
};
