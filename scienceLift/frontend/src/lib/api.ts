'use client'

import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export async function getPapers(skip = 0, limit = 20) {
  return apiClient.get(`/api/papers?skip=${skip}&limit=${limit}`)
}

export async function getPaper(id: number) {
  return apiClient.get(`/api/papers/${id}`)
}

export async function login(email: string, password: string) {
  return apiClient.post('/api/auth/login', { email, password })
}

export async function register(username: string, email: string, password: string) {
  return apiClient.post('/api/auth/register', { username, email, password })
}

export async function getUserProfile(userId: number) {
  return apiClient.get(`/api/users/${userId}`)
}
