import clockIcon from '../assets/clock.png'
import filesIcon from '../assets/file12.png'
import settingsIcon from '../assets/settings.png'
import ConnectWallet from './ConnectWallet.jsx'

export default function Menu({ onOpenSnake, onOpenDialer, onOpenClock, onOpenSettings, onConnected }) {
  return (
    <div className="menu-grid">
      <button className="app-icon" onClick={onOpenSnake} title="Snake">
        <div className="snake-icon">🐍</div>
        <div className="label">Snake</div>
      </button>
      <button className="app-icon" onClick={onOpenDialer} title="Phone">
        <img src={filesIcon} alt="Dialer" />
        <div className="label">Dialer</div>
      </button>
      <button className="app-icon" onClick={onOpenClock} title="Clock">
        <img src={clockIcon} alt="Clock" />
        <div className="label">Clock</div>
      </button>
      <button className="app-icon" onClick={onOpenSettings} title="Settings">
        <img src={settingsIcon} alt="Settings" />
        <div className="label">Settings</div>
      </button>
      <ConnectWallet onConnected={onConnected} />
    </div>
  )
}



