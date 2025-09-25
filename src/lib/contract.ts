import { ethers } from 'ethers';
import { CONTRACT_CONFIG, MONAD_TESTNET } from './config';

// Contract interface
export interface Bet {
    player: string;
    choice: number;
    amount: string;
    timestamp: number;
    isResolved: boolean;
    isWinner: boolean;
    diceResult: number;
}

export class DiceBetContract {
    private contract: ethers.Contract;
    private provider: ethers.Provider;
    private signer?: ethers.Signer;

    constructor(provider: ethers.Provider, signer?: ethers.Signer) {
        this.provider = provider;
        this.signer = signer;

        // Create contract instance
        this.contract = new ethers.Contract(
            CONTRACT_CONFIG.address,
            CONTRACT_CONFIG.abi,
            signer || provider
        );
    }

    // Get contract instance
    getContract(): ethers.Contract {
        return this.contract;
    }

    // Place a bet
    async placeBet(choice: number, betAmount: string): Promise<ethers.ContractTransactionResponse> {
        if (!this.signer) {
            throw new Error('Signer not available');
        }

        const betAmountWei = ethers.parseEther(betAmount);

        const tx = await this.contract.placeBet(choice, {
            value: betAmountWei,
        });

        return tx;
    }

    // Get bet information
    async getBet(betId: number): Promise<Bet> {
        const bet = await this.contract.getBet(betId);

        return {
            player: bet.player,
            choice: Number(bet.choice),
            amount: ethers.formatEther(bet.amount),
            timestamp: Number(bet.timestamp),
            isResolved: bet.isResolved,
            isWinner: bet.isWinner,
            diceResult: Number(bet.diceResult),
        };
    }

    // Get pending bet for a player
    async getPendingBet(playerAddress: string): Promise<number> {
        const pendingBetId = await this.contract.getPendingBet(playerAddress);
        return Number(pendingBetId);
    }

    // Get contract balance
    async getContractBalance(): Promise<string> {
        const balance = await this.contract.getContractBalance();
        return ethers.formatEther(balance);
    }

    // Get minimum bet amount
    async getMinBetAmount(): Promise<string> {
        const minBetAmount = await this.contract.getMinBetAmount();
        return ethers.formatEther(minBetAmount);
    }

    // Get maximum bet amount
    async getMaxBetAmount(): Promise<string> {
        const maxBetAmount = await this.contract.getMaxBetAmount();
        return ethers.formatEther(maxBetAmount);
    }

    // Listen for events
    onBetPlaced(callback: (betId: number, player: string, choice: number, amount: string) => void) {
        this.contract.on('BetPlaced', (betId, player, choice, amount) => {
            callback(Number(betId), player, Number(choice), ethers.formatEther(amount));
        });
    }

    onDiceRolled(callback: (betId: number, player: string, choice: number, diceResult: number, isWinner: boolean) => void) {
        this.contract.on('DiceRolled', (betId, player, choice, diceResult, isWinner) => {
            callback(Number(betId), player, Number(choice), Number(diceResult), isWinner);
        });
    }

    onPayoutSent(callback: (betId: number, player: string, amount: string, isWinner: boolean) => void) {
        this.contract.on('PayoutSent', (betId, player, amount, isWinner) => {
            callback(Number(betId), player, ethers.formatEther(amount), isWinner);
        });
    }

    // Remove all listeners
    removeAllListeners() {
        this.contract.removeAllListeners();
    }
}

// Utility function to create contract instance
export function createContractInstance(provider: ethers.Provider, signer?: ethers.Signer): DiceBetContract {
    return new DiceBetContract(provider, signer);
}

// Utility function to get provider
export function getProvider(): ethers.Provider {
    return new ethers.JsonRpcProvider(MONAD_TESTNET.rpcUrl);
}
