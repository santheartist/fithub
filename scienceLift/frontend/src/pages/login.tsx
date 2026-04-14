'use client'

import { useState } from 'react'
import Header from '@/components/Header'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement login
  }

  return (
    <>
      <Header />
      <main className="max-w-md mx-auto mt-12">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">Login</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg hover:bg-blue-600 font-semibold">
            Login
          </button>

          <p className="text-center mt-4 text-sm">
            Don't have an account? <a href="/register" className="text-primary hover:underline">Register</a>
          </p>
        </form>
      </main>
    </>
  )
}
