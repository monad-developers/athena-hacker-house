import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion'
import { useState } from 'react'

export function SwipeCard({
  children,
  onSwipe,
}: {
  children: React.ReactNode
  onSwipe?: (dir: 'left' | 'right') => void
}) {
  const controls = useAnimation()
  const [exited, setExited] = useState(false)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-300, 0, 300], [-12, 0, 12])
  const rightOpacity = useTransform(x, [80, 160], [0, 1])
  const leftOpacity = useTransform(x, [-80, -160], [0, 1])

  if (exited) return null

  return (
    <div className="absolute inset-0">
      <motion.div
        drag="x"
        style={{ x, rotate }}
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={(_, info) => {
          const threshold = Math.min(window.innerWidth * 0.25, 180)
          if (info.offset.x > threshold) {
            onSwipe?.('right')
            setExited(true)
            controls.start({ x: 800, opacity: 0, rotate: 14 })
          } else if (info.offset.x < -threshold) {
            onSwipe?.('left')
            setExited(true)
            controls.start({ x: -800, opacity: 0, rotate: -14 })
          } else {
            controls.start({ x: 0, rotate: 0 })
          }
        }}
        animate={controls}
        className="relative h-full w-full rounded-3xl p-[2px] shadow-[0_10px_50px_rgba(0,0,0,0.45)] bg-gradient-to-br from-pink-500/40 via-indigo-500/40 to-transparent"
      >
        {/* Card body (glass) */}
        <div className="relative h-full w-full rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-md">
          {/* Decorative glows */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-pink-500/15 blur-2xl" />
          <div className="pointer-events-none absolute -left-10 -bottom-10 h-44 w-44 rounded-full bg-indigo-500/15 blur-2xl" />

          {/* Affirm/Reject badges */}
          <motion.div
            style={{ opacity: rightOpacity }}
            className="pointer-events-none absolute right-6 top-6 rounded-full border border-emerald-400/40 bg-emerald-400/15 px-4 py-1.5 text-xs font-semibold text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.35)]"
          >
            ❤️ Match →
          </motion.div>
          <motion.div
            style={{ opacity: leftOpacity }}
            className="pointer-events-none absolute left-6 top-6 rounded-full border border-rose-400/40 bg-rose-400/15 px-4 py-1.5 text-xs font-semibold text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.35)]"
          >
            ← Skip ❌
          </motion.div>

          {/* Content */}
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-auto">
              {children}
            </div>
            <div className="mt-6 text-center text-[11px] text-neutral-400">
              Swipe right to proceed to swap, left to skip
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}


