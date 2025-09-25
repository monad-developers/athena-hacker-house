import './App.css'
import { useWalletContext } from './context/WalletContext'
import { Link, Outlet } from 'react-router-dom'

function Nav() {
  return (
    <nav className="mx-auto flex max-w-5xl items-center justify-between p-4">
      <div className="flex items-center gap-4">
        <Link to="/" className="text-lg font-semibold">Compatibility Swipe</Link>
        <div className="hidden gap-3 text-sm text-neutral-300 md:flex">
          <Link to="/" className="hover:text-white">Home</Link>
          <Link to="/pools" className="hover:text-white">Pools</Link>
        </div>
      </div>
    </nav>
  )
}

function App() {
  const { isConnected, address, isConnecting, connect, disconnect } = useWalletContext()

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-neutral-950/70 backdrop-blur">
        <Nav />
        <div className="mx-auto flex max-w-5xl items-center justify-end p-4 pt-0">
          {isConnected ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-300">{address?.slice(0, 6)}…{address?.slice(-4)}</span>
              <button onClick={disconnect} className="rounded-lg bg-neutral-800 px-3 py-2 text-xs font-medium hover:bg-neutral-700">Disconnect</button>
            </div>
          ) : (
            <button disabled={isConnecting} onClick={connect} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 disabled:opacity-60">
              {isConnecting ? 'Connecting…' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-4">
        <Outlet />
      </main>
    </div>
  )
}

export default App
