'use client'

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Welcome to FitHub</h1>
        <p className="text-xl text-gray-600">Discover research papers powered by AI</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="text-3xl mb-2">📚</div>
          <h3 className="font-bold mb-2">Millions of Papers</h3>
          <p className="text-gray-600">Search across multiple research databases</p>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg">
          <div className="text-3xl mb-2">🤖</div>
          <h3 className="font-bold mb-2">AI-Powered Search</h3>
          <p className="text-gray-600">Get intelligent summaries and recommendations</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg">
          <div className="text-3xl mb-2">👥</div>
          <h3 className="font-bold mb-2">Community</h3>
          <p className="text-gray-600">Share and discuss research with others</p>
        </div>
      </div>
    </main>
  )
}
