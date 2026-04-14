'use client'

export default function ProtectedRoute({ children, isAuthenticated }: { children: React.ReactNode; isAuthenticated: boolean }) {
  if (!isAuthenticated) {
    return <div className="text-center p-8">Please log in to access this page.</div>
  }
  return <>{children}</>
}
