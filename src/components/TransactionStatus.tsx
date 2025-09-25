'use client';

interface TransactionStatusProps {
    isPlacingBet: boolean;
    isRolling: boolean;
    selectedNumber: number | null;
}

export function TransactionStatus({ isPlacingBet, isRolling, selectedNumber }: TransactionStatusProps) {
    if (!isPlacingBet && !isRolling) return null;

    return (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-semibold mb-4">Transaction Status</h3>

            <div className="space-y-4">
                {/* Step 1: Placing Bet */}
                <div className="flex items-center space-x-3">
                    <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
            ${isPlacingBet ? 'bg-purple-500 text-white' : 'bg-green-500 text-white'}
          `}>
                        {isPlacingBet ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            '✓'
                        )}
                    </div>
                    <div>
                        <p className={`font-medium ${isPlacingBet ? 'text-white' : 'text-green-400'}`}>
                            {isPlacingBet ? 'Placing Bet...' : 'Bet Placed'}
                        </p>
                        {selectedNumber && (
                            <p className="text-sm text-gray-300">
                                Betting {selectedNumber} with 0.05 ETH
                            </p>
                        )}
                    </div>
                </div>

                {/* Step 2: Rolling Dice */}
                <div className="flex items-center space-x-3">
                    <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
            ${isRolling ? 'bg-purple-500 text-white' : isPlacingBet ? 'bg-gray-600 text-gray-400' : 'bg-green-500 text-white'}
          `}>
                        {isRolling ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : isPlacingBet ? (
                            '2'
                        ) : (
                            '✓'
                        )}
                    </div>
                    <div>
                        <p className={`font-medium ${isRolling ? 'text-white' : isPlacingBet ? 'text-gray-400' : 'text-green-400'}`}>
                            {isRolling ? 'Rolling Dice...' : isPlacingBet ? 'Waiting for Bet Confirmation' : 'Dice Rolled'}
                        </p>
                        {isRolling && (
                            <p className="text-sm text-gray-300">
                                Generating random result on-chain
                            </p>
                        )}
                    </div>
                </div>

                {/* Step 3: Result */}
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold bg-gray-600">
                        3
                    </div>
                    <div>
                        <p className="font-medium">
                            {isRolling ? 'Processing Result...' : 'Waiting for Result'}
                        </p>
                        <p className="text-sm">
                            {isRolling ? 'Checking if you won' : 'Result will appear here'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
                <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                        style={{
                            width: isRolling ? '66%' : isPlacingBet ? '33%' : '0%'
                        }}
                    />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>Bet Placed</span>
                    <span>Dice Rolled</span>
                    <span>Result</span>
                </div>
            </div>
        </div>
    );
}
