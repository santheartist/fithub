'use client'

export default function PaperAIFeatures() {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">AI-Powered Features</h2>
      <div className="grid grid-cols-3 gap-4">
        <button className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
          <div className="text-2xl mb-2">✨</div>
          <div className="font-semibold text-sm">AI Summary</div>
        </button>
        <button className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
          <div className="text-2xl mb-2">🎯</div>
          <div className="font-semibold text-sm">Relevance Score</div>
        </button>
        <button className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
          <div className="text-2xl mb-2">💡</div>
          <div className="font-semibold text-sm">Ask AI</div>
        </button>
      </div>
    </div>
  )
}
