/**
 * Header component with search and auth
 */

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiSearch, FiLogIn } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';

export const Header: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-blue-900 dark:to-purple-900 border-b border-gray-200 dark:border-purple-500/20 shadow-lg dark:shadow-2xl">
      <div className="ml-64 px-8 py-4 flex items-center justify-between gap-6">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
          <div className="relative group">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-300 group-focus-within:text-blue-600 dark:group-focus-within:text-purple-300 transition pointer-events-none z-10" size={20} />
            <input
              type="text"
              placeholder="Search papers, authors, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-100 dark:bg-slate-800/50 border border-gray-300 dark:border-purple-500/30 rounded-xl focus:outline-none focus:border-blue-600 dark:focus:border-purple-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-purple-400/20 transition text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 hover:border-gray-400 dark:hover:border-purple-400/50 backdrop-blur-sm"
            />
          </div>
        </form>

        {/* Auth & Theme Section */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {isAuthenticated && user ? (
            <div className="flex items-center gap-4 pl-4 border-l border-gray-200 dark:border-purple-500/20">
              <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-400 dark:to-purple-600 shadow-lg ring ring-blue-300 dark:ring-purple-400/30 flex-shrink-0">
                {user.profile_picture_url ? (
                  <img
                    src={`${user.profile_picture_url}${user.profile_picture_url?.includes('?') ? '&' : '?'}t=${Date.now()}`}
                    alt={user.username}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Failed to load header profile picture:', user.profile_picture_url);
                      console.error('Image src:', (e.target as HTMLImageElement).src);
                      e.currentTarget.style.display = 'none';
                    }}
                    onLoad={() => {
                      console.log('Header profile picture loaded successfully');
                    }}
                  />
                ) : (
                  <span className="text-white font-bold text-sm">
                    {user.username[0].toUpperCase()}
                  </span>
                )}
              </div>
              <Link
                href={`/profile/${user.id}`}
                className="px-3 py-2 text-gray-700 dark:text-slate-200 font-semibold hover:text-blue-600 dark:hover:text-purple-300 transition text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-purple-500/10"
              >
                {user.username}
              </Link>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-purple-300 transition font-semibold text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-purple-500/10"
              >
                <FiLogIn size={18} />
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-600 dark:to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-700 dark:hover:to-purple-700 transition font-semibold text-sm shadow-lg dark:shadow-purple-500/50 hover:shadow-blue-400/50"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
