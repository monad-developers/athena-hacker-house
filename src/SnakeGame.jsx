import { useEffect, useRef, useState } from 'react'

const CELL_SIZE = 10
const COLS = 24
const ROWS = 12
const TICK_MS = 120

function getRandomCell(exclude) {
  while (true) {
    const x = Math.floor(Math.random() * COLS)
    const y = Math.floor(Math.random() * ROWS)
    const hit = exclude.some((c) => c.x === x && c.y === y)
    if (!hit) return { x, y }
  }
}

export default function SnakeGame({ onExit, onScoreMilestone }) {
  const canvasRef = useRef(null)
  const [direction, setDirection] = useState({ x: 1, y: 0 })
  const [snake, setSnake] = useState([{ x: 4, y: 6 }, { x: 3, y: 6 }, { x: 2, y: 6 }])
  const [food, setFood] = useState(getRandomCell([{ x: 4, y: 6 }, { x: 3, y: 6 }, { x: 2, y: 6 }]))
  const [running, setRunning] = useState(true)
  const [score, setScore] = useState(0)
  const [milestoneTriggered, setMilestoneTriggered] = useState(false)

  useEffect(() => {
    const element = canvasRef.current
    if (!element) return
    const handleKey = (e) => {
      const k = e.key.toLowerCase()
      if (k === 'escape') { onExit && onExit(); return }
      if (!running) return
      if (['arrowup','w'].includes(k) && direction.y !== 1) { e.preventDefault(); setDirection({ x: 0, y: -1 }) }
      if (['arrowdown','s'].includes(k) && direction.y !== -1) { e.preventDefault(); setDirection({ x: 0, y: 1 }) }
      if (['arrowleft','a'].includes(k) && direction.x !== 1) { e.preventDefault(); setDirection({ x: -1, y: 0 }) }
      if (['arrowright','d'].includes(k) && direction.x !== -1) { e.preventDefault(); setDirection({ x: 1, y: 0 }) }
    }
    element.addEventListener('keydown', handleKey)
    return () => element.removeEventListener('keydown', handleKey)
  }, [direction, running, onExit])

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setSnake((prev) => {
        const head = prev[0]
        const next = { x: (head.x + direction.x + COLS) % COLS, y: (head.y + direction.y + ROWS) % ROWS }
        const hitsSelf = prev.some((c) => c.x === next.x && c.y === next.y)
        if (hitsSelf) { setRunning(false); return prev }
        const newSnake = [next, ...prev]
        if (next.x === food.x && next.y === food.y) {
          setFood(getRandomCell(newSnake))
          setScore((s) => s + 1)
          return newSnake
        } else {
          newSnake.pop()
          return newSnake
        }
      })
    }, TICK_MS)
    return () => clearInterval(id)
  }, [direction, food, running])

  // Fire once when score reaches 6
  useEffect(() => {
    if (!milestoneTriggered && score >= 6) {
      setMilestoneTriggered(true)
      console.log('🎉 Snake game milestone reached! Score:', score, 'Triggering swap...')
      onScoreMilestone && onScoreMilestone(score)
    }
  }, [score, milestoneTriggered, onScoreMilestone])

  const [showSwapNotification, setShowSwapNotification] = useState(false)

  // Show swap notification when milestone is reached
  useEffect(() => {
    if (score >= 6 && !milestoneTriggered) {
      setShowSwapNotification(true)
      const timer = setTimeout(() => {
        setShowSwapNotification(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [score, milestoneTriggered])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw grid background
    ctx.fillStyle = 'rgba(0, 40, 0, 0.6)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw food
    ctx.fillStyle = '#ff5252'
    ctx.fillRect(food.x * CELL_SIZE, food.y * CELL_SIZE, CELL_SIZE, CELL_SIZE)

    // Draw snake
    ctx.fillStyle = '#aaff66'
    snake.forEach((c, i) => {
      ctx.globalAlpha = Math.max(0.6, 1 - i * 0.02)
      ctx.fillRect(c.x * CELL_SIZE, c.y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
    })
    ctx.globalAlpha = 1

    // Score
    ctx.fillStyle = '#dfffd6'
    ctx.font = '10px monospace'
    ctx.fillText(`S:${score}  Esc=Exit`, 4, 12)
  }, [snake, food, score])

  const restart = () => {
    const base = [{ x: 4, y: 6 }, { x: 3, y: 6 }, { x: 2, y: 6 }]
    setSnake(base)
    setFood(getRandomCell(base))
    setDirection({ x: 1, y: 0 })
    setScore(0)
    setMilestoneTriggered(false)
    setRunning(true)
  }

  const handlePointer = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    // Focus so keys work after click/tap
    canvas.focus()
    const rect = canvas.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const midX = rect.width / 2
    const midY = rect.height / 2
    const dx = cx - midX
    const dy = cy - midY
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0 && direction.x !== 1) setDirection({ x: -1, y: 0 })
      if (dx > 0 && direction.x !== -1) setDirection({ x: 1, y: 0 })
    } else {
      if (dy < 0 && direction.y !== 1) setDirection({ x: 0, y: -1 })
      if (dy > 0 && direction.y !== -1) setDirection({ x: 0, y: 1 })
    }
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {!running && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, zIndex: 2 }}>
          <button onClick={restart}>Restart</button>
          <button onClick={onExit}>Exit</button>
        </div>
      )}
      {showSwapNotification && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.9)',
          color: '#fff',
          padding: '16px 24px',
          borderRadius: '8px',
          fontSize: '14px',
          zIndex: 3,
          textAlign: 'center',
          border: '2px solid #00ff00'
        }}>
          🎉 6 Points Reached!<br />
          🔄 Triggering swap...
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="snake-canvas"
        tabIndex={0}
        onClick={handlePointer}
        onTouchStart={(e) => { if (e.touches && e.touches[0]) { handlePointer(e.touches[0]) } }}
        width={COLS * CELL_SIZE}
        height={ROWS * CELL_SIZE}
      />
    </div>
  )
}


