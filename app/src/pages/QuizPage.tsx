import { Quiz } from '../features/compatibility/Quiz'
import { type QuizAnswer, scoreDiscreteTokens } from '../features/compatibility/data'
import { useAppState } from '../state/appState'
import { useNavigate } from 'react-router-dom'
import { SYMBOL_TO_ADDRESS } from '../features/compatibility/data'

export default function QuizPage() {
  const { setMatches } = useAppState()
  const navigate = useNavigate()

  function handleQuizDone(a: QuizAnswer) {
    // Use discrete token list provided by user for ordering
    const discrete = scoreDiscreteTokens(a)
    const ranked = discrete.map((d) => ({ symbol: d.symbol, scorePct: d.scorePct, bio: `${d.name}`, liquidity: '—', feeBps: 0, address: SYMBOL_TO_ADDRESS[d.symbol] }))
    setMatches(ranked)
    navigate('/swipe')
  }

  return (
    <div className="relative mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Find Your Perfect Token Match</h2>
        <div className="mx-auto mt-3 h-1 w-40 rounded-full bg-white/10">
          <div className="h-1 w-1/3 rounded-full bg-gradient-to-r from-pink-400 to-indigo-400"></div>
        </div>
      </div>
      <div className="glass rounded-2xl p-5 shadow-2xl">
        <Quiz onDone={handleQuizDone} />
      </div>
    </div>
  )
}


