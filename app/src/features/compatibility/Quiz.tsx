import { useState } from 'react'
import type { QuizAnswer } from './data'

export function Quiz({ onDone }: { onDone: (answers: QuizAnswer) => void }) {
  const [answers, setAnswers] = useState<QuizAnswer>({ risk: 'medium', horizon: 'medium', vibe: 'balanced' })
  const [step, setStep] = useState<number>(0)
  const [sector, setSector] = useState<string>('memes')
  const [volatility, setVolatility] = useState<string>('medium')
  const [frequency, setFrequency] = useState<string>('swing')
  const [chainPref, setChainPref] = useState<string>('monad')

  const totalSteps = 7
  const progressPct = Math.round(((step + 1) / totalSteps) * 100)

  return (
    <div className="flex flex-col gap-6">
      {/* Progress */}
      <div className="w-full">
        <div className="mb-2 flex items-center justify-between text-xs text-neutral-400">
          <span>Question {step + 1} of {totalSteps}</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/10">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-pink-400 to-indigo-400 transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Step 1: Risk */}
      {step === 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-1">
          <div className="mb-3 text-base font-medium">How spicy is your risk appetite? 🌶️</div>
          <div className="flex flex-wrap gap-2">
            {([
              { key: 'low', label: 'Low • Cozy 🔒' },
              { key: 'medium', label: 'Medium • Balanced ⚖️' },
              { key: 'high', label: 'High • YOLO 🚀' },
            ] as const).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setAnswers((a) => ({ ...a, risk: opt.key }))}
                className={`pill px-4 py-3 text-sm transition ${answers.risk === opt.key ? 'bg-indigo-600 text-white' : 'bg-neutral-800 hover:bg-neutral-700'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Horizon */}
      {step === 1 && (
        <div className="animate-in fade-in slide-in-from-bottom-1">
          <div className="mb-3 text-base font-medium">Whats your ideal holding period? ⏳</div>
          <div className="flex flex-wrap gap-2">
            {([
              { key: 'short', label: 'Short • Quick flings 💫' },
              { key: 'medium', label: 'Medium • Steady dates 🗓️' },
              { key: 'long', label: 'Long • Serious only 💍' },
            ] as const).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setAnswers((a) => ({ ...a, horizon: opt.key }))}
                className={`pill px-4 py-3 text-sm transition ${answers.horizon === opt.key ? 'bg-indigo-600 text-white' : 'bg-neutral-800 hover:bg-neutral-700'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Vibe */}
      {step === 2 && (
        <div className="animate-in fade-in slide-in-from-bottom-1">
          <div className="mb-3 text-base font-medium">Pick your vibe 🎭</div>
          <div className="flex flex-wrap gap-2">
            {([
              { key: 'serious', label: 'Serious • Safe & sound 🛡️' },
              { key: 'balanced', label: 'Balanced • A lil fun ⚖️' },
              { key: 'degen', label: 'Degen • Memes only 🐸' },
            ] as const).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setAnswers((a) => ({ ...a, vibe: opt.key }))}
                className={`pill px-4 py-3 text-sm transition ${answers.vibe === opt.key ? 'bg-indigo-600 text-white' : 'bg-neutral-800 hover:bg-neutral-700'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Favorite sector (UI only) */}
      {step === 3 && (
        <div className="animate-in fade-in slide-in-from-bottom-1">
          <div className="mb-3 text-base font-medium">What makes your heart race? 💘</div>
          <div className="flex flex-wrap gap-2">
            {([
              { key: 'memes', label: 'Memecoins 🐶' },
              { key: 'bluechips', label: 'Blue chips 🟦' },
              { key: 'stables', label: 'Stables 💵' },
              { key: 'narratives', label: 'Hot narratives 🔥' },
            ] as const).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSector(opt.key)}
                className={`pill px-4 py-3 text-sm transition ${sector === opt.key ? 'bg-indigo-600 text-white' : 'bg-neutral-800 hover:bg-neutral-700'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 5: Volatility tolerance (UI only) */}
      {step === 4 && (
        <div className="animate-in fade-in slide-in-from-bottom-1">
          <div className="mb-3 text-base font-medium">How much volatility can you cuddle with? 🧸</div>
          <div className="flex flex-wrap gap-2">
            {([
              { key: 'low', label: 'Low • Keep me comfy 🛌' },
              { key: 'medium', label: 'Medium • Spice it up 🌶️' },
              { key: 'high', label: 'High • Chaos lover ⚡' },
            ] as const).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setVolatility(opt.key)}
                className={`pill px-4 py-3 text-sm transition ${volatility === opt.key ? 'bg-indigo-600 text-white' : 'bg-neutral-800 hover:bg-neutral-700'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 6: Trade frequency (UI only) */}
      {step === 5 && (
        <div className="animate-in fade-in slide-in-from-bottom-1">
          <div className="mb-3 text-base font-medium">How often do you like to trade? 💃</div>
          <div className="flex flex-wrap gap-2">
            {([
              { key: 'scalp', label: 'Scalp • Minute-by-minute 🧠' },
              { key: 'swing', label: 'Swing • A few days 🪩' },
              { key: 'position', label: 'Position • Weeks+ 🧭' },
            ] as const).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setFrequency(opt.key)}
                className={`pill px-4 py-3 text-sm transition ${frequency === opt.key ? 'bg-indigo-600 text-white' : 'bg-neutral-800 hover:bg-neutral-700'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 7: Chain preference (UI only) */}
      {step === 6 && (
        <div className="animate-in fade-in slide-in-from-bottom-1">
          <div className="mb-3 text-base font-medium">Pick your date spot (chain) 🗺️</div>
          <div className="flex flex-wrap gap-2">
            {([
              { key: 'monad', label: 'Monad 💜' },
              { key: 'eth', label: 'Ethereum 🧿' },
              { key: 'alt', label: 'Alt L1/L2 🌀' },
            ] as const).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setChainPref(opt.key)}
                className={`pill px-4 py-3 text-sm transition ${chainPref === opt.key ? 'bg-indigo-600 text-white' : 'bg-neutral-800 hover:bg-neutral-700'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="mt-2 flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="pill border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-40"
          disabled={step === 0}
        >
           Back
        </button>
        {step < totalSteps - 1 ? (
          <button
            onClick={() => setStep((s) => Math.min(totalSteps - 1, s + 1))}
            className="pill btn-glow-blue bg-blue-600 px-5 py-2 text-sm font-medium hover:bg-blue-500"
          >
            Next 
          </button>
        ) : (
          <button
            onClick={() => onDone(answers)}
            className="pill btn-glow-pink bg-pink-600 px-5 py-2 text-sm font-medium hover:bg-pink-500"
          >
            See Matches ❤️
          </button>
        )}
      </div>
    </div>
  )
}


