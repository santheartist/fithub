/**
 * Paper Card component for displaying papers with Reddit-like layout
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { FiThumbsUp, FiMessageCircle, FiExternalLink, FiChevronDown, FiShare2 } from 'react-icons/fi';
import { Paper } from '@/context/PaperContext';

interface PaperCardProps {
  paper: Paper;
  onLike: (paperId: number, isLiked: boolean) => void;
  onRepost: (paperId: number, isReposted: boolean) => void;
}

export const PaperCard: React.FC<PaperCardProps> = ({ paper, onLike, onRepost }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullSummary, setShowFullSummary] = useState(false);

  // Truncate summary to show more content (5-6 lines instead of 2-3)
  const MAX_SUMMARY_LENGTH = 520;
  const truncatedSummary = paper.ai_summary && paper.ai_summary.length > MAX_SUMMARY_LENGTH 
    ? paper.ai_summary.substring(0, MAX_SUMMARY_LENGTH) + '...' 
    : paper.ai_summary;

  const shouldTruncate = paper.ai_summary && paper.ai_summary.length > MAX_SUMMARY_LENGTH;

  return (
    <div className="group bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-purple-500/20 rounded-2xl overflow-hidden hover:border-blue-300 dark:hover:border-purple-400/50 transition-all duration-300 mb-4 shadow-lg dark:shadow-xl hover:shadow-lg dark:hover:shadow-2xl dark:hover:shadow-purple-500/20 hover:-translate-y-1">
      {/* Main Content Area - Clickable */}
      <div className="p-6 cursor-pointer">
        {/* Header with category and metadata */}
        <div className="flex items-center gap-3 mb-4">
          <span className="font-bold text-blue-600 dark:text-purple-300 bg-gradient-to-r from-blue-100 dark:from-blue-600/20 to-purple-100 dark:to-purple-600/20 border border-blue-200 dark:border-purple-500/30 px-3 py-1 rounded-full text-xs uppercase tracking-wider">
            {paper.category}
          </span>
          <span className="text-gray-400 dark:text-slate-500">•</span>
          <span className="text-gray-600 dark:text-slate-400 text-xs font-medium">
            {paper.journal_name || 'Peer-reviewed'}
          </span>
        </div>

        {/* Title - Large and clickable */}
        <Link href={`/paper/${paper.id}`}>
          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 leading-snug mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 dark:group-hover:from-blue-400 group-hover:to-purple-600 dark:group-hover:to-purple-400 line-clamp-3 transition duration-300">
            {paper.title}
          </h3>
        </Link>

        {/* Authors */}
        <p className="text-sm text-gray-600 dark:text-slate-400 mb-4 line-clamp-1 font-medium">
          by {paper.authors}
        </p>

        {/* AI Summary with expand/collapse */}
        {paper.ai_summary ? (
          <div className="mb-5">
            <div className="bg-gray-50 dark:bg-slate-700/30 border border-gray-200 dark:border-purple-500/20 rounded-xl p-4 mb-2 dark:backdrop-blur-sm group-hover:border-blue-300 dark:group-hover:border-purple-400/40 transition">
              <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
                {showFullSummary ? paper.ai_summary : truncatedSummary}
              </p>
            </div>
            {shouldTruncate && (
              <button
                onClick={() => setShowFullSummary(!showFullSummary)}
                className="text-xs font-semibold text-blue-600 dark:text-purple-400 hover:text-blue-700 dark:hover:text-purple-300 flex items-center gap-1 transition group/expand"
              >
                {showFullSummary ? '✕ Show less' : '+ Show more'}
                <FiChevronDown size={14} className={`transform transition group-hover/expand:text-blue-700 dark:group-hover/expand:text-purple-300 ${showFullSummary ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-slate-700/30 p-4 mb-5 rounded-xl text-sm text-gray-600 dark:text-slate-400 italic border border-gray-200 dark:border-purple-500/10">
            ⚡ Summary generating...
          </div>
        )}

        {/* View Paper Link - Prominent CTA */}
        {paper.paper_url && (
          <div className="mb-5">
            <a
              href={paper.paper_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition font-semibold text-sm shadow-lg hover:shadow-purple-500/50 group/btn transform hover:scale-105"
              onClick={(e) => e.stopPropagation()}
            >
              <FiExternalLink size={16} className="group-hover/btn:rotate-12 transition" />
              Read Full Paper
            </a>
          </div>
        )}
      </div>

      {/* Action Bar - Modern Style */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-purple-500/20 bg-gray-50 dark:bg-slate-800/50 gap-2 dark:backdrop-blur-sm">
        {/* Upvote */}
        <button
          onClick={() => onLike(paper.id, paper.is_liked_by_user)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl transition font-semibold text-sm transform hover:scale-110 ${
            paper.is_liked_by_user 
              ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-600/20 border border-blue-300 dark:border-blue-500/30' 
              : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-purple-500/10 border border-transparent hover:border-gray-300 dark:hover:border-purple-500/20'
          }`}
        >
          <FiThumbsUp 
            size={18} 
            fill={paper.is_liked_by_user ? 'currentColor' : 'none'}
          />
          <span className="text-xs font-bold">{paper.likes_count}</span>
        </button>

        {/* Comments */}
        <Link
          href={`/paper/${paper.id}`}
          className="flex items-center gap-2 px-3 py-2 rounded-xl transition font-semibold text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-purple-500/10 border border-transparent hover:border-gray-300 dark:hover:border-purple-500/20 transform hover:scale-110"
        >
          <FiMessageCircle size={18} />
          <span className="text-xs font-bold">{paper.comments_count}</span>
        </Link>

        {/* Repost/Share */}
        <button
          onClick={() => onRepost(paper.id, paper.is_reposted_by_user)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl transition font-semibold text-sm transform hover:scale-110 ${
            paper.is_reposted_by_user 
              ? 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-600/20 border border-purple-300 dark:border-purple-500/30' 
              : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-purple-500/10 border border-transparent hover:border-gray-300 dark:hover:border-purple-500/20'
          }`}
        >
          <FiShare2 size={18} />
          <span className="text-xs font-bold">Repost</span>
        </button>
      </div>

      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
};
