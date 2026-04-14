'use client'

import Header from '@/components/Header'

export default function SavedPapers() {
  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Saved Papers</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <p className="text-gray-500">No saved papers yet.</p>
        </div>
      </main>
    </>
  )
}
