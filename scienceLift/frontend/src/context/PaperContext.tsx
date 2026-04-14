'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

const PaperContext = createContext<any>(undefined)

export function PaperProvider({ children }: { children: ReactNode }) {
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [papers, setPapers] = useState([])
  const [savedPapers, setSavedPapers] = useState([])

  return (
    <PaperContext.Provider value={{ selectedPaper, setSelectedPaper, papers, setPapers, savedPapers, setSavedPapers }}>
      {children}
    </PaperContext.Provider>
  )
}

export function usePaper() {
  const context = useContext(PaperContext)
  if (!context) {
    throw new Error('usePaper must be used within PaperProvider')
  }
  return context
}
