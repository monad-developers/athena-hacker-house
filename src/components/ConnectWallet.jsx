import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

export default function ConnectWallet({ onConnected }) {
  const { isConnected, address } = useAccount()
  const { connect, connectors, status, error } = useConnect()
  const { disconnect } = useDisconnect()

  const handleConnect = async (connector) => {
    try {
      await connect({ connector })
      onConnected && onConnected()
    } catch {}
  }

  if (isConnected) {
    const short = `${address.slice(0, 6)}…${address.slice(-4)}`
    return (
      <button className="app-icon" onClick={() => disconnect()} title="Disconnect">
        <div className="snake-icon">🔌</div>
        <div className="label">{short}</div>
      </button>
    )
  }

  const injectedConnector = connectors.find((c) => c.id === injected().id) || connectors[0]

  return (
    <div style={{ display: 'contents' }}>
      {injectedConnector && (
        <button className="app-icon" onClick={() => handleConnect(injectedConnector)} title="Connect Wallet">
          <div className="snake-icon">🦊</div>
          <div className="label">Metamask</div>
        </button>
      )}
      {!injectedConnector && (
        <button className="app-icon" disabled title={status}>
          <div className="snake-icon">⏳</div>
          <div className="label">Connecting…</div>
        </button>
      )}
      {error && <div style={{ display: 'none' }}>{String(error?.message || '')}</div>}
    </div>
  )
}


