/**
 * index.tsx - Home/Feed page
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { PaperCard } from '@/components/PaperCard';
import { useAuth } from '@/context/AuthContext';
import { usePapers } from '@/context/PaperContext';
import { apiClient } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { papers, loading, total, loadPapers, searchPapers, toggleLike, toggleRepost } = usePapers();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [skip, setSkip] = useState(0);
  const [shuffledPapers, setShuffledPapers] = useState<typeof papers | null>(null);

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

  // Load papers on mount and when category changes
  useEffect(() => {
    if (!authLoading) {
      loadPapers(skip, 20, selectedCategory || undefined);
      setShuffledPapers(null); // Reset shuffle when category changes
    }
  }, [selectedCategory, authLoading]);

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    router.push('/login');
    return null;
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-blue-900 dark:to-slate-900">
      {/* Animated background grid */}
      <div className="fixed inset-0 opacity-10 dark:opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 opacity-20 dark:opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)'
        }} />
      </div>

      <Header />
      <Sidebar onCategorySelect={setSelectedCategory} currentCategory={selectedCategory} />

      {/* Main content */}
      <main className="ml-64 pt-8 px-8 pb-20 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Page Header with Modern Typography */}
          <div className="mb-12">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-gradient-to-r from-blue-100 dark:from-blue-600/20 to-purple-100 dark:to-purple-600/20 border border-blue-300 dark:border-purple-500/30 rounded-full text-blue-600 dark:text-purple-300 text-sm font-bold uppercase tracking-widest">
                📚 Research Library
              </span>
            </div>
            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 dark:from-blue-400 to-purple-600 dark:to-purple-400 mb-4 leading-tight">
              {selectedCategory ? `${selectedCategory} Research` : 'Latest Research'}
            </h2>
            <div className="flex items-center justify-between gap-4">
              <p className="text-lg text-gray-700 dark:text-slate-300 font-medium max-w-2xl">
                {total} papers {selectedCategory && `in ${selectedCategory}`} • Discover cutting-edge fitness and wellness research
              </p>
              <button
                onClick={shufflePapers}
                disabled={!papers || papers.length === 0}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition font-bold text-sm shadow-lg hover:shadow-purple-500/50 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🔀 Refresh
              </button>
            </div>
          </div>

          {papers && papers.length > 0 ? (
            <>
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

              {papers && papers.length < total && (
                <button
                  onClick={() => {
                    setSkip(skip + 20);
                    loadPapers(skip + 20, 20, selectedCategory || undefined);
                  }}
                  className="w-full py-4 mt-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition font-bold text-lg shadow-xl hover:shadow-purple-500/50 transform hover:scale-105 active:scale-95"
                >
                  ⚡ Load More Papers
                </button>
              )}
            </>
          ) : (
            <div className="text-center py-24 bg-gradient-to-br from-gray-100 dark:from-slate-800/50 to-gray-200 dark:to-slate-900/50 rounded-3xl border border-gray-300 dark:border-purple-500/20 dark:backdrop-blur-sm">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-900 dark:text-slate-300 text-xl mb-2 font-bold">No papers found</p>
              <p className="text-gray-700 dark:text-slate-400 font-medium">Try a different category or check back later.</p>
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-up {
          animation: fade-up 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
