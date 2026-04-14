/**
 * paper/[id].tsx - Paper detail page
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiArrowLeft, FiThumbsUp, FiDownload, FiShare2, FiMessageCircle } from 'react-icons/fi';
import { apiClient } from '@/lib/api';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { CommentThread } from '@/components/CommentThread';
import PaperChat from '@/components/PaperChat';
import PaperAIFeatures from '@/components/PaperAIFeatures';
import { useAuth } from '@/context/AuthContext';

interface PaperDetail {
  id: number;
  title: string;
  authors: string;
  abstract: string;
  journal_name?: string;
  publication_date?: string;
  category: string;
  doi?: string;
  paper_url?: string;
  pdf_url?: string;
  ai_summary?: string;
  likes_count: number;
  comments_count: number;
  is_liked_by_user: boolean;
  is_saved_by_user: boolean;
  tags: any[];
}

// Helper function to find comment in nested structure
function findComment(comments: any[], commentId: number): any {
  for (const comment of comments) {
    if (comment.id === commentId) return comment;
    if (comment.replies) {
      const found = findComment(comment.replies, commentId);
      if (found) return found;
    }
  }
  return null;
}

export default function PaperDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated } = useAuth();
  const [paper, setPaper] = useState<PaperDetail | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showAIFeatures, setShowAIFeatures] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id && isAuthenticated) {
      loadPaperDetail();
      loadComments();
    }
  }, [id, isAuthenticated]);

  const loadPaperDetail = async () => {
    try {
      const response = await apiClient.getPaperDetail(Number(id));
      setPaper(response.data);
    } catch (err) {
      setError('Failed to load paper');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const response = await apiClient.getPaperComments(Number(id));
      setComments(response.data);
    } catch (err) {
      console.error('Failed to load comments');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await apiClient.createComment(Number(id), commentText, replyingTo || undefined);
      setCommentText('');
      setReplyingTo(null);
      loadComments();
    } catch (err) {
      setError('Failed to post comment');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await apiClient.deleteComment(Number(id), commentId);
      loadComments();
    } catch (err) {
      console.error('Failed to delete comment');
    }
  };

  const handleLikeComment = async (commentId: number, isLiked: boolean) => {
    try {
      if (isLiked) {
        await apiClient.unlikeComment(Number(id), commentId);
      } else {
        await apiClient.likeComment(Number(id), commentId);
      }
      loadComments();
    } catch (err) {
      console.error('Failed to like comment');
    }
  };

  const handleReplyComment = (commentId: number) => {
    setReplyingTo(replyingTo === commentId ? null : commentId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-blue-900 dark:to-slate-900">
        <Header />
        <Sidebar onCategorySelect={() => {}} currentCategory={null} />
        <main className="ml-64 pt-20 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center py-24 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-3xl border border-purple-500/30 shadow-lg dark:shadow-2xl backdrop-blur-sm">
              <p className="text-6xl mb-6">📄</p>
              <p className="text-slate-100 text-2xl mb-4 font-black">Paper not found</p>
              <p className="text-slate-300 font-medium mb-8">This paper might have been removed or is no longer available.</p>
              <Link href="/" className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-bold shadow-lg hover:shadow-purple-500/50 transform hover:scale-105 transition">
                ← Back to feed
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-blue-900 dark:to-slate-900">
      {/* Animated background grid */}
      <div className="fixed inset-0 opacity-10 dark:opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 opacity-20 dark:opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)'
        }} />
      </div>

      <Header />
      <Sidebar onCategorySelect={() => {}} />

      <main className="ml-64 pt-8 px-8 pb-20 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Paper Navigation */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-blue-400 hover:text-blue-300 mb-8 font-semibold text-sm group bg-blue-900/20 rounded-xl border border-blue-500/30 hover:bg-blue-900/40 transition shadow-sm hover:shadow-md backdrop-blur-sm"
          >
            <FiArrowLeft size={18} className="group-hover:-translate-x-1 transition" />
            Back to Feed
          </Link>

          {/* Paper header */}
          <article className="bg-white dark:bg-slate-800/70 border border-gray-200 dark:border-purple-500/30 rounded-3xl p-8 mb-8 shadow-lg dark:shadow-xl dark:backdrop-blur-sm">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-block bg-blue-100 dark:bg-blue-600/50 text-blue-800 dark:text-blue-200 text-xs px-4 py-1.5 rounded-full font-bold uppercase tracking-wider border border-blue-300 dark:border-blue-500/40 shadow-sm dark:shadow-md">
                  {paper.category}
                </span>
              </div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-blue-300 dark:to-purple-300 mb-3 leading-tight">{paper.title}</h1>
              <p className="text-base text-gray-700 dark:text-slate-100 mb-3 font-semibold">{paper.authors}</p>
              {paper.journal_name && (
                <div className="flex items-center gap-2 text-xs">
                  <span>📰</span>
                  <span className="text-gray-600 dark:text-slate-400">
                    Published in <strong className="text-gray-900 dark:text-slate-100">{paper.journal_name}</strong>
                    {paper.publication_date && <span className="text-gray-500 dark:text-slate-500"> • {paper.publication_date}</span>}
                  </span>
                </div>
              )}
            </div>

            {/* Abstract */}
            <div className="my-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <span className="text-xl">📄</span>
                Abstract
              </h2>
              <p className="text-gray-700 dark:text-slate-300 leading-relaxed text-sm font-normal">{paper.abstract}</p>
            </div>

            {/* AI Summary */}
            {paper.ai_summary && (
              <div className="bg-blue-50 dark:bg-purple-900/40 border-l-4 border-blue-300 dark:border-purple-500/60 p-5 mb-6 rounded-xl shadow-sm dark:shadow-md dark:backdrop-blur-sm">
                <h3 className="font-bold text-blue-900 dark:text-purple-200 mb-2 flex items-center gap-2 text-sm">
                  <span className="text-lg animate-pulse">🤖</span>
                  Beginner-Friendly Summary
                </h3>
                <p className="text-blue-800 dark:text-purple-100 leading-relaxed text-xs font-normal">{paper.ai_summary}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200 dark:border-purple-500/20">
              <button 
                onClick={() => setShowChat(!showChat)}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-100 dark:bg-green-600/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-600/50 transition font-semibold border border-green-300 dark:border-green-500/30 shadow-sm dark:shadow-sm text-sm"
              >
                <span className="text-lg">💬</span>
                Ask AI
              </button>
              <button 
                onClick={() => setShowAIFeatures(!showAIFeatures)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-600 dark:to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 dark:hover:from-purple-700 dark:hover:to-pink-700 transition font-semibold shadow-lg dark:shadow-lg hover:shadow-purple-500/50 text-sm"
              >
                <span className="text-lg">✨</span>
                AI Features
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-100 dark:bg-blue-600/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-600/50 transition font-semibold border border-blue-300 dark:border-blue-500/30 shadow-sm dark:shadow-sm text-sm">
                <FiThumbsUp size={18} />
                <span>{paper.likes_count}</span>
              </button>

              {paper.pdf_url && (
                <a
                  href={paper.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-orange-100 dark:bg-orange-600/30 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-600/50 transition font-semibold border border-orange-300 dark:border-orange-500/30 shadow-sm dark:shadow-sm text-sm"
                >
                  <FiDownload size={18} />
                  Download
                </a>
              )}

              {paper.paper_url && (
                <a
                  href={paper.paper_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-100 dark:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-600/50 transition font-semibold border border-indigo-300 dark:border-indigo-500/30 shadow-sm dark:shadow-sm text-sm"
                >
                  <FiShare2 size={18} />
                  View
                </a>
              )}
            </div>
          </article>

          {/* AI Chat Section */}
          {showChat && paper && (
            <PaperChat paperId={Number(id)} paperTitle={paper.title} onClose={() => setShowChat(false)} />
          )}

          {/* AI Features Section */}
          {showAIFeatures && paper && (
            <div className="bg-white dark:bg-slate-800/70 border border-gray-200 dark:border-purple-500/30 rounded-3xl p-8 mb-8 shadow-xl dark:shadow-xl dark:backdrop-blur-sm">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-2xl animate-pulse">✨</span>
                  <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 dark:from-purple-300 to-pink-600 dark:to-pink-300">AI Analysis</h2>
                </div>
                <button 
                  onClick={() => setShowAIFeatures(false)}
                  className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 text-xl hover:bg-gray-100 dark:hover:bg-slate-700/60 p-2 rounded-lg transition font-bold"
                >
                  ✕
                </button>
              </div>
              <PaperAIFeatures paperId={Number(id)} paperTitle={paper.title} />
            </div>
          )}

          {/* Comments Section */}
          <div className="bg-white dark:bg-slate-800/70 border border-gray-200 dark:border-purple-500/30 rounded-3xl p-8 shadow-xl dark:shadow-xl dark:backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl">💬</span>
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 dark:from-blue-300 to-purple-600 dark:to-purple-300">Discussion</h2>
              <span className="ml-auto px-3 py-1 bg-blue-100 dark:bg-blue-600/50 text-blue-700 dark:text-blue-300 rounded-full font-bold text-sm border border-blue-300 dark:border-blue-500/40 shadow-md">
                {paper.comments_count}
              </span>
            </div>

            {/* Comment form */}
            <form onSubmit={handleCommentSubmit} className="mb-6">
              {replyingTo && (
                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs rounded-lg flex justify-between items-center border border-blue-200 dark:border-blue-500/40 backdrop-blur-sm shadow-md">
                  <span className="font-semibold">↩️ Replying to comment #{replyingTo}</span>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="text-xs hover:text-blue-900 dark:hover:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-2 py-1 rounded transition font-bold"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={replyingTo ? "Write a reply..." : "Share your thoughts..."}
                className="w-full px-4 py-3 border border-gray-300 dark:border-purple-500/40 bg-white dark:bg-slate-700/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-purple-400/30 resize-none transition font-normal text-sm shadow-md dark:backdrop-blur-sm"
                rows={3}
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setCommentText('');
                    setReplyingTo(null);
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-slate-300 border border-gray-300 dark:border-slate-600/30 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/30 transition font-semibold text-sm shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm shadow-lg hover:shadow-purple-500/30 transform hover:scale-105 active:scale-95"
                >
                  {replyingTo ? 'Reply' : 'Comment'}
                </button>
              </div>
            </form>

            {/* Comments list */}
            <div className="space-y-3 border-t border-gray-200 dark:border-purple-500/30 pt-6">
              {comments && comments.length > 0 ? (
                comments.map((comment) => (
                  <CommentThread
                    key={comment.id}
                    comment={comment}
                    paperId={Number(id)}
                    onReply={handleReplyComment}
                    onDelete={handleDeleteComment}
                    onLike={(commentId: number) => {
                      const comment = findComment(comments, commentId);
                      if (comment) {
                        handleLikeComment(commentId, comment.is_liked_by_user);
                      }
                    }}
                  />
                ))
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-gray-200 dark:border-purple-500/20 dark:backdrop-blur-sm">
                  <div className="text-3xl mb-2">💭</div>
                  <p className="text-gray-500 dark:text-slate-400 text-sm font-semibold">No comments yet</p>
                  <p className="text-gray-400 dark:text-slate-500 text-xs font-normal">Be the first to share your thoughts!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
