/**
 * search.tsx - Search results page
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { PaperCard } from '@/components/PaperCard';
import { apiClient } from '@/lib/api';
import { usePapers } from '@/context/PaperContext';

type SortOption = 'relevance' | 'date' | 'popularity';

export default function Search() {
  const router = useRouter();
  const { q } = router.query;
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [error, setError] = useState<string | null>(null);
  const [shuffledPapers, setShuffledPapers] = useState<any[] | null>(null);
  const { toggleLike, toggleRepost } = usePapers();
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Function to shuffle papers array
  const shufflePapers = () => {
    if (!papers || papers.length === 0) return;
    
    const shuffled = [...papers];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setShuffledPapers(shuffled);
    console.log('🔀 Papers shuffled!');
  };

  // Debounced search function
  const searchPapers = useCallback(async (query: string, category?: string, sort: SortOption = 'relevance', pageNum: number = 0) => {
    if (!query.trim()) {
      setPapers([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.searchPapers(query, category, sort, pageNum * 10, 10);
      setPapers(response.data.items);
      setTotal(response.data.total);
    } catch (err: any) {
      setError('Search failed. Please try again.');
      console.error('Search failed:', err);
      setPapers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      if (q) {
        searchPapers(q as string, selectedCategory || undefined, sortBy, page);
        setShuffledPapers(null); // Reset shuffle when searching
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [q, selectedCategory, sortBy, page, searchPapers]);

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    setPage(0);  // Reset to first page when category changes
  };

  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort);
    setPage(0);  // Reset to first page when sort changes
  };

  const handleNextPage = () => {
    if ((page + 1) * 10 < total) {
      setPage(page + 1);
    }
  };

  const handlePreviousPage = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-blue-900 dark:to-slate-900">
      {/* Animated background grid */}
      <div className="fixed inset-0 opacity-10 dark:opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 opacity-20 dark:opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)'
        }} />
      </div>

      <Header />
      <Sidebar onCategorySelect={handleCategorySelect} currentCategory={selectedCategory} />

      <main className="ml-64 pt-20 px-8 pb-20 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Search Header */}
          <div className="mb-12">
            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 dark:from-blue-400 to-purple-600 dark:to-purple-400 mb-4">
              Search Results for &quot;{q}&quot;
            </h2>
            <p className="text-lg text-gray-700 dark:text-slate-300 font-medium">
              Found {total} result{total !== 1 ? 's' : ''}
              {selectedCategory && ` in ${selectedCategory}`}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-600 rounded-xl text-red-800 dark:text-red-300 backdrop-blur-sm">
              {error}
            </div>
          )}

          {/* Sort Options and Refresh */}
          {papers.length > 0 && (
            <div className="mb-8 flex gap-3 items-center justify-between bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-purple-500/20 shadow-lg dark:shadow-xl">
              <div className="flex gap-3 items-center flex-1">
                <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">Sort by:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSortChange('relevance')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition transform hover:scale-105 ${
                      sortBy === 'relevance'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-purple-500/50'
                        : 'bg-gray-100 dark:bg-slate-700/50 text-gray-900 dark:text-slate-100 hover:bg-gray-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Relevance
                  </button>
                  <button
                    onClick={() => handleSortChange('date')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition transform hover:scale-105 ${
                      sortBy === 'date'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-purple-500/50'
                        : 'bg-gray-100 dark:bg-slate-700/50 text-gray-900 dark:text-slate-100 hover:bg-gray-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Newest
                  </button>
                  <button
                    onClick={() => handleSortChange('popularity')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition transform hover:scale-105 ${
                      sortBy === 'popularity'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-purple-500/50'
                        : 'bg-gray-100 dark:bg-slate-700/50 text-gray-900 dark:text-slate-100 hover:bg-gray-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Popular
                  </button>
                </div>
              </div>
              <button
                onClick={shufflePapers}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium text-sm shadow-lg hover:shadow-purple-500/50 transform hover:scale-105 active:scale-95 transition"
              >
                🔀 Refresh
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-purple-400 mx-auto"></div>
            </div>
          ) : papers && papers.length > 0 ? (
            <>
              {/* Papers List */}
              <div className="space-y-4">
                {(shuffledPapers || papers).map((paper, index) => (
                  <div key={paper.id} style={{ animationDelay: `${index * 0.05}s` }} className="animate-fade-up">
                    <PaperCard
                      paper={paper}
                      onLike={toggleLike}
                      onRepost={toggleRepost}
                    />
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {total > 10 && (
                <div className="mt-8 flex justify-center items-center gap-4 p-4 bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-gray-200 dark:border-purple-500/20 shadow-lg dark:shadow-xl">
                  <button
                    onClick={handlePreviousPage}
                    disabled={page === 0}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-purple-500/50 transform hover:scale-105 active:scale-95 transition"
                  >
                    ← Previous
                  </button>
                  <span className="text-sm text-gray-600 dark:text-slate-300 font-medium">
                    Page {page + 1} of {Math.ceil(total / 10)}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={(page + 1) * 10 >= total}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-purple-500/50 transform hover:scale-105 active:scale-95 transition"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-24 bg-gradient-to-br from-gray-100 dark:from-slate-800/50 to-gray-200 dark:to-slate-900/50 rounded-3xl border border-gray-300 dark:border-purple-500/20 dark:backdrop-blur-sm">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-900 dark:text-slate-300 text-xl mb-2 font-bold">No papers found</p>
              <p className="text-gray-700 dark:text-slate-400">Try a different search term.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
