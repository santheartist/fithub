/**
 * Comment thread component
 */

import React, { useState } from 'react';
import { FiThumbsUp, FiThumbsDown, FiMessageCircle, FiShare, FiTrash2, FiMinus } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/context/AuthContext';

interface Comment {
  id: number;
  content: string;
  author: {
    id: number;
    username: string;
    profile_picture_url?: string;
  };
  created_at: string;
  likes_count: number;
  is_liked_by_user: boolean;
  replies?: Comment[];
}

interface CommentThreadProps {
  comment: Comment;
  paperId: number;
  onReply: (parentId: number) => void;
  onDelete: (commentId: number) => void;
  onLike: (commentId: number) => void;
  level?: number;
}

export const CommentThread: React.FC<CommentThreadProps> = ({
  comment,
  paperId,
  onReply,
  onDelete,
  onLike,
  level = 0,
}) => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className="flex gap-2 py-1">
        <button
          onClick={() => setCollapsed(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <FiMinus size={16} />
        </button>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {comment.author?.username || 'Unknown User'} • {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
        </span>
      </div>
    );
  }

  return (
    <div className="mb-3">
      <div className="flex gap-3">
        {/* Left vote section */}
        <div className="flex flex-col items-center gap-1 pt-1">
          <button
            onClick={() => onLike(comment.id)}
            className="text-gray-500 hover:text-orange-500 dark:text-gray-400 transition"
            title="Upvote"
          >
            <FiThumbsUp size={14} />
          </button>
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            {comment.likes_count}
          </span>
          <button
            className="text-gray-500 hover:text-blue-500 dark:text-gray-400 transition"
            title="Downvote"
          >
            <FiThumbsDown size={14} />
          </button>
        </div>

        {/* Main content */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="font-bold text-sm text-gray-900 dark:text-white">
              {comment.author?.username || 'Unknown User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </p>
            {user && user.id === comment.author?.id && (
              <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                OP
              </span>
            )}
          </div>

          {/* Comment content */}
          <p className="text-gray-900 dark:text-gray-100 text-sm mb-2">{comment.content}</p>

          {/* Actions */}
          <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 text-xs">
            <button
              onClick={() => onReply(comment.id)}
              className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded transition"
            >
              <FiMessageCircle size={14} />
              Reply
            </button>

            <button
              className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded transition"
            >
              <span>Award</span>
            </button>

            <button
              className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded transition"
            >
              <FiShare size={14} />
              Share
            </button>

            {user && user.id === comment.author?.id && (
              <button
                onClick={() => onDelete(comment.id)}
                className="flex items-center gap-1 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded transition text-red-600 dark:text-red-400"
              >
                <FiTrash2 size={14} />
                Delete
              </button>
            )}

            <button
              onClick={() => setCollapsed(true)}
              className="ml-auto hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded transition"
              title="Collapse"
            >
              <FiMinus size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Replies with vertical line */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-6 mt-2 pl-3 border-l-2 border-gray-300 dark:border-gray-600">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              paperId={paperId}
              onReply={onReply}
              onDelete={onDelete}
              onLike={onLike}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
