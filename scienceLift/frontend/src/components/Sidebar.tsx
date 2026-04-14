/**
 * Sidebar component with navigation and categories
 */

import React from 'react';
import Link from 'next/link';
import { FiHome, FiShare2, FiSettings, FiLogOut } from 'react-icons/fi';
import { FaDumbbell } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { usePapers } from '@/context/PaperContext';

const CATEGORIES = ['Hypertrophy', 'Strength', 'Nutrition', 'Recovery', 'Injury Prevention'];

interface SidebarProps {
  onCategorySelect: (category: string | null) => void;
  currentCategory?: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCategorySelect, currentCategory: propCurrentCategory }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { currentCategory: contextCurrentCategory } = usePapers();
  
  // Use prop if provided, otherwise use context value
  const currentCategory = propCurrentCategory !== undefined ? propCurrentCategory : contextCurrentCategory;

  return (
    <aside className="w-64 bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-900 dark:to-blue-900 border-r border-gray-200 dark:border-purple-500/20 fixed left-0 top-0 h-screen overflow-y-auto flex flex-col z-50 shadow-lg dark:shadow-2xl">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-purple-500/20 flex justify-center">
        <Link href="/">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-2xl shadow-xl cursor-pointer hover:shadow-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105">
            <FaDumbbell className="text-white" size={32} />
          </div>
        </Link>
      </div>

      {/* User Profile Section */}
      {isAuthenticated && user && (
        <div className="p-6 border-b border-gray-200 dark:border-purple-500/20 bg-gray-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-600 flex-shrink-0 shadow-lg ring ring-blue-300 dark:ring-purple-400/30">
              {user.profile_picture_url ? (
                <img
                  src={`${user.profile_picture_url}${user.profile_picture_url?.includes('?') ? '&' : '?'}t=${Date.now()}`}
                  alt={user.username}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Failed to load sidebar profile picture:', user.profile_picture_url);
                    console.error('Image src:', (e.target as HTMLImageElement).src);
                    e.currentTarget.style.display = 'none';
                  }}
                  onLoad={() => {
                    console.log('Sidebar profile picture loaded successfully');
                  }}
                />
              ) : (
                <span className="text-white font-bold text-sm">
                  {user.username[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-gray-900 dark:text-slate-100 truncate">{user.username}</p>
              <p className="text-xs text-gray-600 dark:text-slate-400 truncate">@{user.username}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="p-4 space-y-2 flex-shrink-0">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-purple-500/20 transition text-gray-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-slate-100 font-semibold text-sm group"
        >
          <FiHome size={20} className="group-hover:text-blue-600 dark:group-hover:text-purple-400 transition" />
          <span>Home</span>
        </Link>

        {isAuthenticated && (
          <>
            <Link
              href="/reposts"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-purple-500/20 transition text-gray-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-slate-100 font-semibold text-sm group"
            >
              <FiShare2 size={20} className="group-hover:text-blue-600 dark:group-hover:text-purple-400 transition" />
              <span>My Reposts</span>
            </Link>

            <Link
              href={`/profile/${user?.id}`}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-purple-500/20 transition text-gray-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-slate-100 font-semibold text-sm group"
            >
              <span className="text-lg group-hover:scale-110 transition">👤</span>
              <span>My Profile</span>
            </Link>
          </>
        )}
      </nav>

      {/* Categories */}
      <div className="px-4 py-4 border-t border-gray-200 dark:border-purple-500/20 flex-1">
        <h3 className="text-xs font-bold text-blue-600 dark:text-purple-400 uppercase tracking-widest mb-4 px-1">📚 Categories</h3>
        <div className="space-y-2">
          <button
            onClick={() => onCategorySelect(null)}
            className={`w-full text-left px-4 py-2.5 rounded-lg transition text-sm font-semibold transform hover:scale-105 ${
              currentCategory === null
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-purple-500/20'
            }`}
          >
            All
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => onCategorySelect(category)}
              className={`w-full text-left px-4 py-2.5 rounded-lg transition text-sm font-semibold transform hover:scale-105 ${
                currentCategory === category
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-purple-500/20'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Settings & Logout */}
      {isAuthenticated && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 mt-auto">
          <Link
            href="/settings"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition mb-2 text-gray-700 dark:text-gray-300 font-medium"
          >
            <FiSettings size={20} />
            <span className="text-sm">Settings</span>
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition text-red-600 dark:text-red-400 font-medium"
          >
            <FiLogOut size={20} />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      )}
    </aside>
  );
};
