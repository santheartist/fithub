'use client'

export function handleApiError(error: any) {
  if (error.response) {
    const { status, data } = error.response
    const message = data?.detail || data?.message || 'An error occurred'
    return { status, message }
  }
  return { status: 500, message: error.message || 'Network error' }
}

export function formatError(error: any): string {
  if (typeof error === 'string') return error
  if (error?.response?.data?.detail) return error.response.data.detail
  if (error?.message) return error.message
  return 'An unexpected error occurred'
}
