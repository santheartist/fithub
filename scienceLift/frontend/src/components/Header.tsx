'use client'

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-primary">FitHub</div>
        <div className="flex gap-4">
          <a href="/" className="hover:text-primary">Home</a>
          <a href="/search" className="hover:text-primary">Search</a>
          <a href="/saved-papers" className="hover:text-primary">Saved</a>
          <a href="/profile" className="hover:text-primary">Profile</a>
        </div>
      </nav>
    </header>
  )
}
