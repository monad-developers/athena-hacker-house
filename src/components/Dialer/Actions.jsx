export default function DialerActions({ onCall, onClearAll, onDelete, onHome }) {
  return (
    <div className="action-buttons">
      <button className="action-btn call-btn" onClick={onCall} title="Call"></button>
      <button className="action-btn clear-btn" onClick={onClearAll} title="Clear All"></button>
      <button className="action-btn delete-btn" onClick={onDelete} title="Delete Last"></button>
      <button className="action-btn home-btn" onClick={onHome} title="Home"></button>
    </div>
  )
}


