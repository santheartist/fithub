/**
 * Example integration of AI features into paper detail page
 * This shows how to use PaperChat and PaperAIFeatures components
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { apiClient } from '@/lib/api';
import PaperChat from '@/components/PaperChat';
import PaperAIFeatures from '@/components/PaperAIFeatures';

interface Paper {
  id: number;
  title: string;
  authors: string;
  journal_name?: string;
  doi?: string;
  paper_url: string;
  ai_summary?: string;
  category: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  saves_count: number;
  is_liked_by_user: boolean;
  is_saved_by_user: boolean;
}

export default function PaperDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [paper, setPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPaper();
    }
  }, [id]);

  const fetchPaper = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getPaperDetail(parseInt(id as string));
      setPaper(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load paper');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!paper) return;
    try {
      if (paper.is_liked_by_user) {
        await apiClient.unlikePaper(paper.id);
        setPaper({ ...paper, is_liked_by_user: false, likes_count: paper.likes_count - 1 });
      } else {
        await apiClient.likePaper(paper.id);
        setPaper({ ...paper, is_liked_by_user: true, likes_count: paper.likes_count + 1 });
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleSave = async () => {
    if (!paper) return;
    try {
      if (paper.is_saved_by_user) {
        await apiClient.unsavePaper(paper.id);
        setPaper({ ...paper, is_saved_by_user: false, saves_count: paper.saves_count - 1 });
      } else {
        await apiClient.savePaper(paper.id);
        setPaper({ ...paper, is_saved_by_user: true, saves_count: paper.saves_count + 1 });
      }
    } catch (err) {
      console.error('Error toggling save:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'Paper not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Paper Header */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-8 mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {paper.title}
              </h1>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                  {paper.category}
                </span>
                {paper.journal_name && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {paper.journal_name}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleLike}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  paper.is_liked_by_user
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                ❤️ {paper.likes_count}
              </button>
              <button
                onClick={handleSave}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  paper.is_saved_by_user
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                💾 {paper.saves_count}
              </button>
            </div>
          </div>

          <p className="text-gray-700 dark:text-gray-300 mb-4">
            <span className="font-semibold">Authors:</span> {paper.authors}
          </p>

          {paper.doi && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              <span className="font-semibold">DOI:</span> {paper.doi}
            </p>
          )}

          <a
            href={paper.paper_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            📄 Read Full Paper
          </a>
        </div>

        {/* AI Features Section - NEW */}
        <PaperAIFeatures 
          paperId={paper.id}
          paperTitle={paper.title}
          onChatOpen={() => setShowChat(true)}
        />

        {/* Comments Section */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-8 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            💬 Discussion
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Comments feature coming soon...</p>
        </div>

        {/* Chat Component - NEW */}
        {showChat && (
          <PaperChat
            paperId={paper.id}
            paperTitle={paper.title}
            onClose={() => setShowChat(false)}
          />
        )}
      </div>
    </div>
  );
}
