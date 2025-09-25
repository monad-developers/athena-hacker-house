'use client';

import { GAME_CONFIG } from '@/lib/config';
import { diceIcons } from './GameInterface';

interface BetFormProps {
    selectedNumber: number | null;
    betAmount: string;
    onNumberSelect: (number: number) => void;
    onBetAmountChange: (amount: string) => void;
    onPlaceBet: () => void;
    isPlacingBet: boolean;
    isRolling: boolean;
    disabled: boolean;
    minBetAmount: string;
    maxBetAmount: string;
}

export function BetForm({
    selectedNumber,
    betAmount,
    onNumberSelect,
    onBetAmountChange,
    onPlaceBet,
    isPlacingBet,
    isRolling,
    disabled,
    minBetAmount,
    maxBetAmount
}: BetFormProps) {

    return (
        <div className="space-y-6">
            {/* Bet Amount Input */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <label className="block text-sm font-medium mb-2 tracking-tight">
                    Bet Amount (ETH)
                </label>
                <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => onBetAmountChange(e.target.value)}
                    min={minBetAmount}
                    max={maxBetAmount}
                    step="0.001"
                    disabled={disabled}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder={`Enter amount (${minBetAmount} - ${maxBetAmount} ETH)`}
                />
                <div className="flex justify-between items-center mt-2 text-sm">
                    <span className="text-xs tracking-tight">Min: {minBetAmount} ETH</span>
                    <span className="text-xs tracking-tight">Max: {maxBetAmount} ETH</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-300 tracking-tight">Potential Win:</span>
                    <span className="text-[#a696ff] font-semibold tracking-tight">
                        {(parseFloat(betAmount || '0') * GAME_CONFIG.winMultiplier).toFixed(3)} ETH
                    </span>
                </div>
            </div>

            {/* Number Selection */}
            <div>
                <h3 className="text-lg font-semibold mb-4 tracking-tight">Choose Your Number</h3>
                <div className="grid grid-cols-3 gap-3">
                    {Array.from({ length: 6 }, (_, i) => i + 1).map((number) => {
                        const IconComponent = diceIcons[number as keyof typeof diceIcons];
                        const isSelected = selectedNumber === number;

                        return (
                            <button
                                key={number}
                                onClick={() => onNumberSelect(number)}
                                disabled={disabled}
                                className={`
                  relative p-4 rounded-lg border-2 transition-all duration-200
                  ${isSelected
                                        ? 'border-[#6e54ff] bg-[#6e54ff]/50 text-white'
                                        : 'border-white/20 bg-white/5 text-gray-300 hover:border-white/40 hover:bg-white/10'
                                    }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                            >
                                <IconComponent className="w-8 h-8 mx-auto mb-2" />
                                <span className="text-sm font-medium tracking-tight">{number}</span>
                                {isSelected && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#6e54ff] rounded-full flex items-center justify-center">
                                        <span className="text-xs tracking-tight">✓</span>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Place Bet Button */}
            <button
                onClick={onPlaceBet}
                disabled={!selectedNumber || disabled || isPlacingBet}
                className={`
          w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-300 tracking-tight
          ${selectedNumber && !disabled && !isPlacingBet
                        ? 'bg-gradient-to-r bg-[#6e54ff] text-white transform hover:scale-105 shadow-lg cursor-pointer'
                        : 'bg-[#6e54ff]/30 text-white cursor-not-allowed'
                    }
        `}
            >
                {isPlacingBet ? (
                    <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="tracking-tight">Placing Bet...</span>
                    </div>
                ) : isRolling ? (
                    <span className="tracking-tight">Rolling Dice...</span>
                ) : !selectedNumber ? (
                    <span className="tracking-tight">Select a Number First</span>
                ) : (
                    <span className="tracking-tight">Roll the Dice</span>
                )}
            </button>

            {/* Game Rules
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="text-sm font-semibold mb-2">Game Rules</h4>
                <ul className="text-xs text-gray-300 space-y-1">
                    <li>• Choose a number between 1-6</li>
                    <li>• Enter your bet amount ({minBetAmount} - {maxBetAmount} ETH)</li>
                    <li>• If dice matches your number, win double your bet</li>
                    <li>• If not, you lose your bet</li>
                </ul>
            </div> */}
        </div>
    );
}
