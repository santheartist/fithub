'use client'

export default function PaperCard({ paper }: { paper: any }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      <h3 className="text-lg font-semibold mb-2">{paper.title}</h3>
      <p className="text-gray-600 text-sm mb-4">{paper.authors}</p>
      <p className="text-gray-700 mb-4 line-clamp-3">{paper.abstract}</p>
      <div className="flex justify-between items-center">
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{paper.source}</span>
        <button className="text-primary hover:underline text-sm">View Details</button>
      </div>
    </div>
  )
}
