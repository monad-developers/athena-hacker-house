export default function DialerKeypad({ onPress }) {
  return (
    <div className="keypad" aria-label="invisible keypad">
      {["1","2","3","4","5","6","7","8","9","*","0","#"].map((k) => (
        <button key={k} onClick={() => onPress(k)} aria-label={`key ${k}`}>
        
        </button>
      ))}
    </div>
  )
}


