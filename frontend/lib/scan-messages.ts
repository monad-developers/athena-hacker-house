// Engaging messages for QR scan process
export const scanMessages = {
  // Initial scan validation
  validating: {
    title: "Validating QR Code...",
    messages: [
      "Checking QR code authenticity",
      "Verifying your progress",
      "Preparing token transfer"
    ]
  },

  // During blockchain transaction
  processing: {
    title: "Processing Your Tokens...",
    messages: [
      "🚀 Submitting transaction to blockchain",
      "⏳ Waiting for network confirmation", 
      "🔗 Securing your tokens on-chain",
      "✨ Almost there, finalizing transfer"
    ]
  },

  // Success states
  success: {
    title: "Success!",
    messages: [
      "🎉 Tokens received successfully!",
      "🏆 Progress updated",
      "🔓 New hint unlocked"
    ]
  },

  // Error states with retry encouragement
  error: {
    title: "Oops!",
    messages: [
      "❌ Transfer failed",
      "🔄 Please try scanning again",
      "💡 Check your network connection"
    ]
  }
}

// Get a random message from a category
export function getRandomMessage(category: keyof typeof scanMessages): string {
  const messages = scanMessages[category].messages
  return messages[Math.floor(Math.random() * messages.length)]
}

// Get progressive messages (cycles through them)
export function getProgressiveMessage(category: keyof typeof scanMessages, step: number): string {
  const messages = scanMessages[category].messages
  return messages[step % messages.length]
}

// Sequence of messages for the full scan process
export const scanSequence = [
  { phase: 'validating', duration: 1000 },
  { phase: 'processing', duration: 3000 },
  { phase: 'success', duration: 2000 }
] as const

export type ScanPhase = typeof scanSequence[number]['phase']
