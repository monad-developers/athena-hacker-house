import { useNavigate } from 'react-router-dom'
import { SwipeCard } from '../components/SwipeCard'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { useAppState } from '../state/appState'
import { useEffect, useState } from 'react'
import { TOKEN_META } from '../features/compatibility/data'

export default function SwipePage() {
  const { matches, setSelectedSymbol, setSelectedAddress } = useAppState()
  const navigate = useNavigate()
  const [deck, setDeck] = useState(matches ?? [])

  useEffect(() => {
    if (matches) setDeck(matches)
  }, [matches])

  if (!deck || deck.length === 0) {
    return <div className="text-sm text-neutral-400">Take the quiz first to see compatible pools.</div>
  }

  return (
    <div className="relative mx-auto h-[calc(100vh-220px)] max-w-3xl floating-icons">
      {[...deck].reverse().map((m, idx) => (
        <div key={m.symbol} style={{ zIndex: idx + 1 }} className="absolute inset-0">
          <SwipeCard
            onSwipe={(dir) => {
              if (dir === 'right') {
                setSelectedSymbol(m.symbol)
                setSelectedAddress(m.address ?? null)
                navigate('/swap')
              }
              if (dir === 'left') {
                setDeck((prev) => prev.filter((x) => x.symbol !== m.symbol))
              }
            }}
          >
            <div
              className={`relative flex h-full flex-col overflow-hidden rounded-2xl bg-gradient-to-br ${TOKEN_META[m.symbol]?.gradient || 'from-white/5 to-white/0'}`}
              style={
                TOKEN_META[m.symbol]?.imageUrl
                  ? {
                      backgroundImage: `url(${TOKEN_META[m.symbol]?.imageUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    }
                  : undefined
              }
            >
              <div className="mb-6 text-center">
                <div className="mb-1 text-3xl font-semibold tracking-tight text-white drop-shadow">{m.symbol} <span className="text-pink-300">·</span> {m.scorePct}% match</div>
                <div className="text-xs text-neutral-200">{TOKEN_META[m.symbol]?.tagline || m.bio}</div>
              </div>
              <Card className="glass-noblur flex-1 rounded-2xl bg-white/10">
                <CardHeader>
                  <div className="text-neutral-300">Details</div>
                </CardHeader>
                <CardContent>
                  <div className="mb-3 text-sm text-white/90">{TOKEN_META[m.symbol]?.blurb}</div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-neutral-300">
                    <div className="rounded-md border border-white/10 bg-white/5 p-2">Liquidity<br/><span className="text-neutral-100">{m.liquidity}</span></div>
                    <div className="rounded-md border border-white/10 bg-white/5 p-2">Fee<br/><span className="text-neutral-100">{(m.feeBps / 100).toFixed(2)}%</span></div>
                  </div>
                </CardContent>
              </Card>
              <div className="pointer-events-auto mt-6 flex items-center justify-center gap-5">
                <button className="pill btn-glow-red rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm hover:bg-white/15" onClick={() => setDeck((prev) => prev.filter((x) => x.symbol !== m.symbol))}>❌</button>
                <button className="pill btn-glow-blue rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm hover:bg-white/15" onClick={() => { /* superlike noop visual */ }}>⭐</button>
                <button className="pill btn-glow-pink rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm hover:bg-white/15" onClick={() => { setSelectedSymbol(m.symbol); setSelectedAddress(m.address ?? null); navigate('/swap') }}>❤️</button>
              </div>
            </div>
          </SwipeCard>
        </div>
      ))}
    </div>
  )
}


