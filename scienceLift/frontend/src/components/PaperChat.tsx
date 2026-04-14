import React, { useState, useRef, useEffect } from 'react';
import { apiClient } from '../lib/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  id?: number;
  created_at?: string;
}

interface PaperChatProps {
  paperId: number;
  paperTitle: string;
  onClose?: () => void;
}

export default function PaperChat({ paperId, paperTitle, onClose }: PaperChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadExistingConversation = async () => {
    try {
      const response = await apiClient.getPaperConversations(paperId);
      const conversations = response.data;
      
      if (conversations.length > 0) {
        const lastConversation = conversations[conversations.length - 1];
        setConversationId(lastConversation.id);
        
        // Load messages from conversation
        const messagesData = lastConversation.messages || [];
        setMessages(messagesData);
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
    }
  };

  // Load existing conversation on mount
  useEffect(() => {
    loadExistingConversation();
  }, [paperId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.chatAboutPaper(paperId, input);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.data.response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setConversationId(response.data.conversation_id);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to get response. Please try again.');
      // Remove the user message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed bottom-6 right-6 w-full max-w-md h-[500px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 flex flex-col shadow-2xl dark:shadow-2xl dark:shadow-purple-500/30 rounded-2xl overflow-hidden z-50 dark:backdrop-blur-xl dark:bg-opacity-95">
      {/* Header with Gradient */}
      <div className="px-6 py-5 bg-white dark:bg-gradient-to-r dark:from-slate-800 dark:to-slate-800/80 border-b border-gray-200 dark:border-purple-500/30 flex justify-between items-center gap-3 flex-shrink-0 dark:shadow-lg rounded-t-2xl">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-lg text-gray-900 dark:text-slate-100 leading-tight">💬 Ask AI</h3>
          <p className="text-gray-500 dark:text-slate-400 text-xs mt-0.5 truncate font-medium">{paperTitle}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 bg-gray-100 dark:bg-slate-700/50 hover:bg-gray-200 dark:hover:bg-slate-700 p-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 border border-gray-300 dark:border-slate-600/30"
            aria-label="Close chat"
            title="Close chat"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-gray-50 dark:bg-slate-800/50">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-center px-4">
            <div>
              <div className="text-5xl mb-4 animate-pulse">💬</div>
              <p className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 dark:from-blue-400 to-purple-600 dark:to-purple-400 font-bold text-lg mb-2">Start a Conversation</p>
              <p className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed max-w-xs">
                Ask anything about this research paper. I can explain concepts, answer questions, and provide deeper insights.
              </p>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div className={`flex gap-2 max-w-xs group`}>
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <span className="text-white text-xs font-bold">AI</span>
                </div>
              )}
              <div
                className={`px-4 py-3 rounded-2xl transition-all duration-200 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700 font-medium'
                    : 'bg-gray-100 dark:bg-slate-700/70 text-gray-900 dark:text-slate-100 shadow-md border border-gray-200 dark:border-slate-600/50 hover:shadow-lg dark:hover:border-purple-500/50 rounded-bl-sm'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
              </div>
              {message.role === 'assistant' && (
                <button
                  onClick={() => copyToClipboard(message.content, index)}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-gray-500 dark:text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-slate-700/60 rounded-lg border border-transparent dark:hover:border-slate-600/50"
                  title="Copy message"
                >
                  {copied === index ? (
                    <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex gap-2 items-end">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-white text-xs font-bold">AI</span>
              </div>
              <div className="bg-gray-100 dark:bg-slate-700/70 px-4 py-3 rounded-2xl shadow-md border border-gray-200 dark:border-slate-600/50 rounded-bl-sm">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="animate-fade-in">
            <div className="bg-red-50 dark:bg-red-900/40 border border-red-300 dark:border-red-600/60 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg text-sm flex gap-2 shadow-md dark:backdrop-blur-sm">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="px-4 py-4 border-t border-gray-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/60 flex-shrink-0 dark:backdrop-blur-sm">
        <div className="flex gap-2 bg-gray-50 dark:bg-slate-700/50 rounded-full px-4 py-2.5 border border-gray-300 dark:border-slate-600/50 focus-within:border-blue-500 dark:focus-within:border-purple-500/60 focus-within:ring-1 focus-within:ring-blue-500/40 dark:focus-within:ring-purple-500/40 transition-all hover:border-gray-400 dark:hover:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700/60">
          <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5.951-2.975 5.951 2.975a1 1 0 001.169-1.409l-7-14z" />
          </svg>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this paper..."
            disabled={loading}
            className="flex-1 bg-transparent text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-500 text-sm focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex-shrink-0 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 disabled:text-gray-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed transition-colors p-1 hover:scale-110 active:scale-95 font-bold"
            aria-label="Send message"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5.951-2.975 5.951 2.975a1 1 0 001.169-1.409l-7-14z" />
            </svg>
          </button>
        </div>
      </form>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
