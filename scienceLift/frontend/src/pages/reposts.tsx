import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import { getErrorMessage } from '@/lib/errorHandler';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function RepostsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [reposts, setReposts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadReposts();
  }, [user, page, selectedCategory]);

  const loadReposts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getUserReposts(page * itemsPerPage, itemsPerPage, selectedCategory || undefined);
      setReposts(response.data.items || []);
      setTotalCount(response.data.total || 0);
    } catch (err: any) {
      setError(getErrorMessage(err));
      console.error('Error loading reposts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRepost = async (paperId: number) => {
    if (!confirm('Are you sure you want to remove this repost?')) return;
    try {
      await apiClient.unrepostPaper(paperId);
      setReposts(reposts.filter(r => r.paper_id !== paperId));
      setTotalCount(totalCount - 1);
    } catch (err: any) {
      setError(getErrorMessage(err));
    }
  };

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    setPage(0); // Reset to first page when category changes
  };

  if (!user) return <LoadingSpinner />;

  const totalPages = Math.ceil(totalCount / itemsPerPage);

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

      <div className="ml-64 pt-20 px-8 pb-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-100 mb-2">My Reposts</h1>
            {selectedCategory && (
              <p className="text-gray-600 dark:text-slate-300">
                Filtering by: <span className="font-semibold text-blue-600 dark:text-purple-300">{selectedCategory}</span>
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 p-4 rounded-xl mb-6 border border-red-200 dark:border-red-600 backdrop-blur-sm">{error}</div>
          )}

          {loading ? (
            <LoadingSpinner />
          ) : reposts.length === 0 ? (
            <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-lg dark:shadow-xl border border-gray-200 dark:border-purple-500/20 p-12 text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">No Reposts Yet</h2>
              <p className="text-gray-600 dark:text-slate-300 mb-6">
                You haven't reposted any papers yet. Start sharing interesting papers!
              </p>
              <Link href="/" className="text-blue-600 dark:text-purple-400 hover:text-blue-700 dark:hover:text-purple-300 font-medium transition">
                Browse Papers
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {reposts.map((repost) => (
                  <div key={repost.id} className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-lg dark:shadow-xl border border-gray-200 dark:border-purple-500/20 hover:border-blue-300 dark:hover:border-purple-400/50 transition-all duration-300 dark:hover:shadow-2xl dark:hover:shadow-purple-500/20 hover:-translate-y-1">
                    <div className="p-6">
                      {/* Repost Meta */}
                      <div className="text-xs text-gray-600 dark:text-slate-400 font-medium mb-3">
                        Reposted {new Date(repost.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })} at {new Date(repost.created_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>

                      {/* Paper Details */}
                      {repost.paper && (
                        <div>
                          <Link
                            href={`/paper/${repost.paper.id}`}
                            className="block hover:underline"
                          >
                            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2 line-clamp-2 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 dark:hover:from-blue-400 hover:to-purple-600 dark:hover:to-purple-400 transition">
                              {repost.paper.title}
                            </h3>
                          </Link>
                          <p className="text-gray-700 dark:text-slate-300 mb-4 line-clamp-3 text-sm">
                            {repost.paper.description || repost.paper.abstract || 'No description available'}
                          </p>
                          <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-slate-400 mb-4 font-medium">
                            {repost.paper.authors && (
                              <span>by {repost.paper.authors}</span>
                            )}
                            {repost.paper.published_date && (
                              <span>• Published: {new Date(repost.paper.published_date).toLocaleDateString()}</span>
                            )}
                            {repost.paper.citation_count && (
                              <span>• Citations: {repost.paper.citation_count}</span>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-3">
                            <Link
                              href={`/paper/${repost.paper.id}`}
                              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium text-sm shadow-lg hover:shadow-purple-500/50 transform hover:scale-105 transition"
                            >
                              View Paper
                            </Link>
                            <button
                              onClick={() => handleDeleteRepost(repost.paper.id)}
                              className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-600 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 font-medium text-sm transition"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-8 p-4 bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-gray-200 dark:border-purple-500/20 shadow-lg dark:shadow-xl">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 font-medium text-sm shadow-lg hover:shadow-purple-500/50 transform hover:scale-105 transition"
                  >
                    Previous
                  </button>
                  <span className="text-gray-600 dark:text-slate-300 font-medium">
                    Page {page + 1} of {totalPages} ({totalCount} total reposts)
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 font-medium text-sm shadow-lg hover:shadow-purple-500/50 transform hover:scale-105 transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
