import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import phone from './assets/phone.png'
import './App.css'
import SnakeGame from './SnakeGame.jsx'
import { useState as useReactState } from 'react'
import { useTriggerSwap } from './api/useTriggerSwap.js'
import Menu from './components/Menu.jsx'
import DialerDisplay from './components/Dialer/Display.jsx'
import DialerActions from './components/Dialer/Actions.jsx'
import DialerKeypad from './components/Dialer/Keypad.jsx'
import Clock from './components/Clock.jsx'
import Settings from './components/Settings.jsx'

function App() {
  const [digits, setDigits] = useState("")
  const [mode, setMode] = useState('menu') // 'menu' | 'dialer' | 'snake' | 'clock' | 'settings'
  const { isConnected } = useAccount()
  const [swapResult, setSwapResult] = useReactState({ txHash: '0x', message: '' })
  const [isSwapping, setIsSwapping] = useReactState(false)

  // Clear swap result message after 5 seconds
  useEffect(() => {
    if (swapResult.message) {
      const timer = setTimeout(() => {
        setSwapResult({ txHash: '0x', message: '' })
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [swapResult.message, setSwapResult])

  // Configure default MON->USDC on Monad testnet
  const monSymbol = 'MON'
  const fromToken = { symbol: monSymbol, address: undefined, decimals: 18 } // Native MON token
  const usdcAddress = import.meta.env.VITE_USDC_ADDRESS || '0x' // USDC contract address on Monad testnet
  const toToken = { symbol: 'USDC', address: usdcAddress, decimals: 6 }
  const triggerSwap = useTriggerSwap({ amount: '0.01', fromToken, toToken, setSwapResult, setIsSwapping })

  // Log swap configuration
  console.log('🔧 Swap configuration:', {
    fromToken,
    toToken,
    amount: '0.01',
    usdcAddress,
    hasUsdcAddress: !!usdcAddress && usdcAddress !== '0x'
  })

  const press = (value) => {
    setDigits((prev) => (prev + value).slice(-20))
  }

  const clearAll = () => {
    setDigits("")
  }

  const makeCall = () => {
    if (digits) {
      alert(`Calling ${digits}...`)
    } else {
      alert("Please enter a number first")
    }
  }

  const goHome = () => {
    setMode('menu')
  }

  const deleteLast = () => {
    setDigits((prev) => prev.slice(0, -1))
  }

  return (
    <>
        <div className="phone">
          <img src={phone} alt="phone" />
          <div className="overlay">
            <div className="screen">
              {mode === 'dialer' && (
                <DialerDisplay digits={digits} />
              )}
              {mode === 'menu' && (
                <Menu
                  onOpenSnake={() => setMode(isConnected ? 'snake' : 'menu')}
                  onOpenDialer={() => setMode('dialer')}
                  onOpenClock={() => setMode('clock')}
                  onOpenSettings={() => setMode('settings')}
                  onConnected={() => setMode('snake')}
                />
              )}
              {mode === 'snake' && (
                <div className="snake-wrapper">
                  {isConnected ? (
                    <>
                      <SnakeGame
                        onExit={() => setMode('menu')}
                        onScoreMilestone={async () => {
                          if (isSwapping) {
                            console.log('⚠️ Swap already in progress, skipping...')
                            return
                          }
                          try {
                            console.log('🚀 Triggering swap from SnakeGame milestone...')
                            await triggerSwap()
                            console.log('✅ Swap triggered successfully from SnakeGame')
                          } catch (e) {
                            // message shown below via state
                            console.error('❌ Swap failed from SnakeGame:', e)
                          }
                        }}
                      />
                      {/* Swap Status Display */}
                      {isSwapping && (
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: 'rgba(0, 0, 0, 0.8)',
                          color: '#fff',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          zIndex: 10
                        }}>
                          🔄 Processing swap...
                        </div>
                      )}
                      {swapResult.message && (
                        <div style={{
                          position: 'absolute',
                          bottom: '10px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: swapResult.txHash !== '0x' ? 'rgba(0, 128, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)',
                          color: '#fff',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          zIndex: 10,
                          maxWidth: '90%',
                          textAlign: 'center'
                        }}>
                          {swapResult.txHash !== '0x' ? '✅ ' : '❌ '}
                          {swapResult.message}
                          {swapResult.message.includes('Wallet client not available') && (
                            <div style={{ marginTop: '4px', fontSize: '9px', opacity: 0.8 }}>
                              💡 Try refreshing the page or reconnecting your wallet
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'#fff'}}>Connect a wallet to play.</div>
                  )}
                </div>
              )}
              {mode === 'clock' && (
                <Clock />
              )}
              {mode === 'settings' && (
                <Settings />
              )}
            </div>
            {mode === 'dialer' ? (
              <DialerActions
                onCall={makeCall}
                onClearAll={clearAll}
                onDelete={deleteLast}
                onHome={goHome}
              />
            ) : (
              <div className="action-buttons">
                <button className="action-btn home-btn" onClick={goHome} title="Home"></button>
              </div>
            )}
            {mode === 'dialer' && (
              <DialerKeypad onPress={press} />
            )}
          </div>
        </div>
    </>
  )
}

export default App
