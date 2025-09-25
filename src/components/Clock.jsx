import { useEffect, useState } from 'react'

export default function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ fontSize: 18, letterSpacing: 2 }}>{hh}:{mm}:{ss}</div>
      <div style={{ fontSize: 10 }}>{now.toDateString()}</div>
    </div>
  )
}



