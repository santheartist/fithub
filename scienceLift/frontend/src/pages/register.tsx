/**
 * register.tsx - Registration page with FitHub branding
 */

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaDumbbell } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/errorHandler';

export default function Register() {
  const router = useRouter();
  const { register, isAuthenticated } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (isAuthenticated) {
    router.push('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await register(username, email, password);
      router.push('/');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-blue-900 dark:to-purple-900 flex relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-10 dark:opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 opacity-20 dark:opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)'
        }} />
      </div>

      {/* Left Side - FitHub Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 flex-col items-center justify-center p-12 relative z-10 shadow-2xl">
        <div className="text-center max-w-md">
          <div className="flex items-center justify-center gap-3 mb-8 animate-bounce" style={{ animationDuration: '3s' }}>
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl shadow-2xl border border-white/30">
              <FaDumbbell className="text-white" size={48} />
            </div>
          </div>
          <h2 className="text-5xl font-black text-white mb-4">ScienceLift</h2>
          <p className="text-blue-100 text-lg mb-8 font-medium">
            Discover science-backed fitness research and connect with the community
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3 group">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-white/40 transition">
                <span className="text-white font-bold text-lg">✓</span>
              </div>
              <p className="text-blue-100 font-medium">Access peer-reviewed fitness papers</p>
            </div>
            <div className="flex items-start gap-3 group">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-white/40 transition">
                <span className="text-white font-bold text-lg">✓</span>
              </div>
              <p className="text-blue-100 font-medium">Discuss with fitness enthusiasts</p>
            </div>
            <div className="flex items-start gap-3 group">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-white/40 transition">
                <span className="text-white font-bold text-lg">✓</span>
              </div>
              <p className="text-blue-100 font-medium">Stay informed with latest research</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile Logo - Only visible on small screens */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-2xl shadow-lg">
              <FaDumbbell className="text-white" size={32} />
            </div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 dark:from-blue-400 to-purple-600 dark:to-purple-400">ScienceLift</h2>
          </div>

          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 dark:from-blue-300 to-purple-600 dark:to-purple-300 mb-2">Create Account</h1>
          <p className="text-gray-700 dark:text-slate-400 mb-8 font-medium">Join ScienceLift to discuss fitness research</p>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-500/50 text-red-700 dark:text-red-200 px-4 py-3 rounded-xl mb-6 text-sm dark:backdrop-blur-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-slate-200 mb-2 uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={50}
                className="w-full px-4 py-3 border border-gray-300 dark:border-purple-500/30 rounded-xl focus:outline-none focus:border-blue-600 dark:focus:border-purple-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-purple-400/20 bg-gray-50 dark:bg-slate-800/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 transition dark:backdrop-blur-sm"
                placeholder="lifter123"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-slate-200 mb-2 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-purple-500/30 rounded-xl focus:outline-none focus:border-blue-600 dark:focus:border-purple-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-purple-400/20 bg-gray-50 dark:bg-slate-800/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 transition dark:backdrop-blur-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-slate-200 mb-2 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 border border-gray-300 dark:border-purple-500/30 rounded-xl focus:outline-none focus:border-blue-600 dark:focus:border-purple-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-purple-400/20 bg-gray-50 dark:bg-slate-800/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 transition dark:backdrop-blur-sm"
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-600 dark:text-slate-400 mt-1.5 font-medium">At least 8 characters</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-slate-200 mb-2 uppercase tracking-wider">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-purple-500/30 rounded-xl focus:outline-none focus:border-blue-600 dark:focus:border-purple-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-purple-400/20 bg-gray-50 dark:bg-slate-800/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 transition dark:backdrop-blur-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed mt-8 shadow-lg hover:shadow-purple-500/50 transform hover:scale-105 active:scale-95"
            >
              {loading ? '⏳ Creating account...' : '🚀 Create Account'}
            </button>
          </form>

          <p className="text-center text-gray-700 dark:text-slate-400 mt-8 font-medium">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 dark:text-purple-400 font-bold hover:text-blue-700 dark:hover:text-purple-300 transition">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
