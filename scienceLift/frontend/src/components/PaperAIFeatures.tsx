import React, { useState } from 'react';
import { apiClient } from '../lib/api';

interface PaperAIFeaturesProps {
  paperId: number;
  paperTitle: string;
  onChatOpen?: () => void;
}

export default function PaperAIFeatures({ paperId, paperTitle, onChatOpen }: PaperAIFeaturesProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'analysis' | 'questions'>('summary');
  const [summaryStyle, setSummaryStyle] = useState<'balanced' | 'technical' | 'simple'>('balanced');
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string | string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGetSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getPaperSummary(paperId, summaryStyle);
      setContent(response.data.summary);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const handleGetQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getResearchQuestions(paperId);
      setContent(response.data.questions);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate research questions');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeTrends = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.analyzeTrends(undefined, 5);
      setContent(response.data.analysis);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to analyze trends');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      );
    }

    if (Array.isArray(content)) {
      return (
        <ul className="space-y-3">
          {content.map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center text-sm font-semibold">
                {index + 1}
              </span>
              <span className="text-gray-700 dark:text-gray-300 text-sm">{item}</span>
            </li>
          ))}
        </ul>
      );
    }

    if (content) {
      return (
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
      );
    }

    return (
      <p className="text-gray-500 dark:text-gray-400 text-sm">Select an option above to generate AI insights.</p>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>✨ AI Research Assistant</span>
        </h2>
        <button
          onClick={onChatOpen}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          💬 Ask AI
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        {(['summary', 'analysis', 'questions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setContent(null);
            }}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab === 'summary' && 'Summary'}
            {tab === 'analysis' && 'Analysis'}
            {tab === 'questions' && 'Research Questions'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mb-6 max-h-96 overflow-y-auto">
        {activeTab === 'summary' && (
          <div>
            <div className="mb-4 flex gap-2">
              {(['balanced', 'technical', 'simple'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => setSummaryStyle(style)}
                  className={`px-3 py-1 text-sm rounded border transition-colors ${
                    summaryStyle === style
                      ? 'bg-blue-100 dark:bg-blue-900 border-blue-500 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </button>
              ))}
              <button
                onClick={handleGetSummary}
                disabled={loading}
                className="ml-auto px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded font-medium disabled:opacity-50 transition-colors"
              >
                Generate
              </button>
            </div>
            {renderContent()}
          </div>
        )}

        {activeTab === 'analysis' && (
          <div>
            <button
              onClick={handleAnalyzeTrends}
              disabled={loading}
              className="mb-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded font-medium disabled:opacity-50 transition-colors"
            >
              Analyze Trends
            </button>
            {renderContent()}
          </div>
        )}

        {activeTab === 'questions' && (
          <div>
            <button
              onClick={handleGetQuestions}
              disabled={loading}
              className="mb-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded font-medium disabled:opacity-50 transition-colors"
            >
              Generate Questions
            </button>
            {renderContent()}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded p-3 text-sm text-blue-700 dark:text-blue-300">
        <p className="font-semibold mb-1">💡 Tip:</p>
        <p>Use the "Ask AI" button to have a detailed conversation about this paper with the AI research assistant.</p>
      </div>
    </div>
  );
}
