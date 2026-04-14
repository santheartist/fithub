'use client'

export default function Sidebar() {
  return (
    <aside className="bg-gray-100 w-64 p-6">
      <h2 className="text-xl font-bold mb-6">Filters</h2>
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Source</h3>
          <div className="space-y-2">
            <label className="flex items-center"><input type="checkbox" className="mr-2" /> CrossRef</label>
            <label className="flex items-center"><input type="checkbox" className="mr-2" /> PubMed</label>
            <label className="flex items-center"><input type="checkbox" className="mr-2" /> Google Scholar</label>
            <label className="flex items-center"><input type="checkbox" className="mr-2" /> DOAJ</label>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Date Range</h3>
          <input type="date" className="w-full px-2 py-1 border rounded" />
        </div>
      </div>
    </aside>
  )
}
