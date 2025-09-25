import { createContext, useContext, useMemo, useState } from 'react'

export type MatchItem = { symbol: string; scorePct: number; bio: string; liquidity: string; feeBps: number; address?: string }

type AppState = {
  matches: MatchItem[] | null
  setMatches: (m: MatchItem[] | null) => void
  selectedSymbol: string | null
  setSelectedSymbol: (s: string | null) => void
  selectedAddress?: string | null
  setSelectedAddress: (a: string | null) => void
}

const Ctx = createContext<AppState | undefined>(undefined)

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [matches, setMatches] = useState<MatchItem[] | null>(null)
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null)
  const value = useMemo(() => ({ matches, setMatches, selectedSymbol, setSelectedSymbol, selectedAddress, setSelectedAddress }), [matches, selectedSymbol, selectedAddress])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAppState() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}


