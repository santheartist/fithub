'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import PaperCard from '@/components/PaperCard'
import Sidebar from '@/components/Sidebar'

export default function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement search
  }

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search papers..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-600">
              Search
            </button>
          </div>
        </form>

        <div className="flex gap-6">
          <Sidebar />
          <div className="flex-1 grid grid-cols-1 gap-4">
            {results.length === 0 ? (
              <p className="text-center text-gray-500">No results yet. Try searching for a topic.</p>
            ) : (
              results.map((paper: any) => <PaperCard key={paper.id} paper={paper} />)
            )}
          </div>
        </div>
      </main>
    </>
  )
}
