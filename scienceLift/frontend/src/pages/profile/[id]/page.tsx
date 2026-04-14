import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const { user: currentUser } = useAuth();
  const userId = id ? parseInt(id as string) : currentUser?.id;

  const [profile, setProfile] = useState<any>(null);
  const [reposts, setReposts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'reposts' | 'saved'>('reposts');
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (userId) {
      loadProfile();
    }
  }, [userId]);

  useEffect(() => {
    if (profile && activeTab === 'reposts') {
      loadReposts();
    }
  }, [profile, activeTab, page]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      let response;
      if (userId === currentUser?.id) {
        response = await apiClient.getMyProfile();
      } else {
        response = await apiClient.getProfile(userId!);
      }
      setProfile(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load profile');
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReposts = async () => {
    try {
      const response = await apiClient.getUserReposts(page * 10, 10);
      setReposts(response.data.reposts || []);
    } catch (err: any) {
      console.error('Error loading reposts:', err);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Sidebar onCategorySelect={() => {}} />
        <div className="ml-64 pt-20 px-4">
          <div className="max-w-4xl mx-auto text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <Sidebar onCategorySelect={() => {}} />
      
      <div className="ml-64 pt-20">
        <div className="max-w-4xl mx-auto">
          {/* Header Banner & Profile Section */}
          <div className="bg-white border-b border-gray-300">
            {/* Banner */}
            <div className="h-40 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 relative">
              {isOwnProfile && (
                <Link
                  href="/settings"
                  className="absolute top-4 right-4 px-4 py-2 bg-white text-blue-600 rounded-full hover:bg-gray-100 font-bold text-sm"
                >
                  Edit Profile
                </Link>
              )}
            </div>

            {/* Profile Info */}
            <div className="px-6 pb-6">
              <div className="flex items-start gap-6 -mt-16 mb-6">
                {/* Avatar */}
                <div className="w-28 h-28 rounded-full bg-gray-300 border-4 border-white overflow-hidden flex-shrink-0 shadow-lg">
                  {profile.profile_picture_url ? (
                    <img
                      src={profile.profile_picture_url}
                      alt={profile.username}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23cbd5e1" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="white" font-size="50" font-weight="bold"%3E' + profile.username[0].toUpperCase() + '%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white text-4xl font-bold">
                      {profile.username[0].toUpperCase()}
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 pt-4">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-gray-900">{profile.username}</h1>
                    {profile.is_admin && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-lg mb-4">u/{profile.username.toLowerCase()}</p>
                  {profile.bio && (
                    <p className="text-gray-700 mb-4 text-base">{profile.bio}</p>
                  )}
                  <p className="text-gray-500 text-sm">
                    Joined {new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 border-t pt-6 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{profile.reposted_papers_count}</div>
                  <div className="text-gray-600 text-sm font-medium">REPOSTS</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{profile.saved_papers_count}</div>
                  <div className="text-gray-600 text-sm font-medium">SAVED</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{profile.comments_count}</div>
                  <div className="text-gray-600 text-sm font-medium">COMMENTS</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          {isOwnProfile && (
            <div className="bg-white border-b border-gray-300">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('reposts')}
                  className={`flex-1 px-6 py-4 font-bold text-sm border-b-2 transition ${
                    activeTab === 'reposts'
                      ? 'border-blue-600 text-blue-600 hover:bg-gray-50'
                      : 'border-transparent text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  REPOSTS
                </button>
                <button
                  onClick={() => setActiveTab('saved')}
                  className={`flex-1 px-6 py-4 font-bold text-sm border-b-2 transition ${
                    activeTab === 'saved'
                      ? 'border-blue-600 text-blue-600 hover:bg-gray-50'
                      : 'border-transparent text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  SAVED
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="bg-white">
            {activeTab === 'reposts' && (
              <div className="border-t border-gray-300">
                {reposts.length === 0 ? (
                  <div className="text-center py-12 px-6">
                    <p className="text-gray-600 text-lg mb-2">No reposts yet</p>
                    <p className="text-gray-500">This user hasn't reposted any papers</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-300">
                    {reposts.map((repost) => (
                      <div key={repost.id} className="p-6 hover:bg-gray-50 transition cursor-pointer">
                        {repost.paper && (
                          <div>
                            <div className="text-xs text-gray-500 mb-2">
                              Reposted {new Date(repost.created_at).toLocaleDateString()}
                            </div>
                            <Link href={`/paper/${repost.paper.id}`}>
                              <h3 className="text-lg font-bold text-blue-600 hover:underline">
                                {repost.paper.title}
                              </h3>
                            </Link>
                            <p className="text-gray-700 text-sm mt-2 line-clamp-3">
                              {repost.paper.abstract || repost.paper.description}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'saved' && (
              <div className="border-t border-gray-300 p-6 text-center">
                <p className="text-gray-600 text-lg">No saved papers yet</p>
                <p className="text-gray-500 text-sm">Visit the saved papers section to view them</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

