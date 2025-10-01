# BlindDiceSwap

**BlindDiceSwap** is a gamified Web3 token swapping experience where chance meets DeFi. Users roll a dice to determine which token they receive in exchange for **WMON**, making every swap exciting and unpredictable.

---

## Why BlindDiceSwap is Cool

- **Gamified Swaps:** Dice rolls make swapping tokens interactive and exciting.  
- **Randomized Rewards:** Each dice roll randomly determines the token and swap amount.  
- **Instant Swaps:** 0x API ensures fast, reliable, and secure swaps.  

---

## Extra Feature – Mandatory Swap Confirmation

If a user cancels a transaction, **MetaMask (or the connected wallet) will pop up again**. Once the **Roll Dice** button is clicked, confirming the swap transaction becomes **compulsory**, ensuring users cannot bypass the intended swap.

---

## Dice Roll Mechanism

- Users click the **Roll Dice** button.  
- Dice results are randomized between **1–6**.  
- Each number maps to a token:  
  - **1 → USDT**  
  - **2 → USDC**  
  - **3 → DAK**  
  - **4 → CHOG**  
  - **5 → YAKI**  
  - **6 → KB**  

---

## Token Swaps via 0x API

- Dice outcome triggers a **WMON → selected token swap**.  
- Swap amounts are randomized between **0.01–0.5 WMON**.  
- 0x API ensures:  
  - Optimal liquidity  
  - Minimal slippage  
  - Secure execution  
- Users see a **live update**: dice result, token received, and swap amount.

---

## Tech Stack

- **Frontend:** React.js, Next.js, Tailwind CSS  
- **Wallet & Auth:** Privy Embedded Wallet / MetaMask  
- **Token Swap:** 0x API  
- **Blockchain:** Monad-compatible EVM network  
- **Smart Contracts:** Solidity  

---

## How It Works

1. User logs in with Privy or MetaMask.  
2. User clicks **Roll Dice**.  
3. Dice result determines which token is swapped.  
4. Swap is executed via **0x API**.  
5. If the user cancels, wallet prompt appears again until confirmed.  
6. Swap results are displayed instantly: token received and WMON spent.

---

## Future Enhancements

- Chainlink VRF for verifiable randomness  
- Multi-token rewards beyond WMON  
- Seasonal challenges or tournaments  
- Push notifications for swaps and rewards  

---

## Screenshots / Demo

*(Add screenshots or GIFs of dice roll, swap result, and wallet popup here)*
