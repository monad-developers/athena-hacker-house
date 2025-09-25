# Athena Hacker House

A monorepo containing Solidity smart contracts (Foundry) and a Next.js workspace scaffold. The core of this repo today is the on-chain components: an ERC20 token (`GMON`) and a simple AMM-like pool (`SimpleSwapPool`), plus deployment and test utilities.

---

## TL;DR

- Smart contracts live in `con/` and use Foundry.
- Build, test, and deploy with Foundry scripts in `con/script/`.
- Broadcast artifacts and caches are kept under `con/broadcast/` and `con/out/`.
- A Next.js setup is scaffolded at the repo root (config present); front-end wiring is WIP.

---

## What it does

This repo provides a minimal on-chain demo of swapping a custom ERC20 token (GMON) against the chain's native currency using a constant-product market maker (CPMM) with a single pool. It includes:

- A mintable ERC20 token (`GMON`) owned by the deployer.
- A simple swap pool (`SimpleSwapPool`) that holds native currency and GMON and lets users swap in either direction with a 0.3% fee.
- Owner-only liquidity seeding and withdrawals (no LP tokens; not a decentralized AMM—centralized operator for demo/testing).

Use cases:

- Demonstrate basic CPMM pricing and slippage.
- Provide a test token and a minimal pool for integration experiments.

---

## Repository layout

- `con/` — Foundry project (Solidity)
  - `src/GMON.sol` — ERC20 token implementation
  - `src/SimpleSwapPool.sol` — Minimal swap pool contract
  - `script/DeployAll.s.sol` — End-to-end deployment script
  - `test/` — Foundry tests
  - `out/` — Compiled ABI/bytecode artifacts (auto-generated)
  - `broadcast/` — Deployment/broadcast logs (auto-generated)
  - `lib/` — Dependencies (`forge-std`, `openzeppelin-contracts`, etc.)
- `API_INTEGRATION_README.md` — Notes for API integration (if applicable)
- `next.config.ts`, `eslint.config.mjs`, `next-env.d.ts` — Next.js scaffold and lint config (front-end WIP)

---

## Prerequisites

- Foundry toolchain
  - Install/update: `curl -L https://foundry.paradigm.xyz | bash` then `foundryup`
- Node.js 18+ (for potential frontend tooling/linting)

---

## Getting started (contracts)

1) Install dependencies

```bash
cd con
forge install
```

2) Build

```bash
forge build
```

3) Test

```bash
forge test -vvv
```

4) Local node (optional)

```bash
anvil
```

In another terminal, set RPC/keys via env vars (see below) and run scripts.

---

## Contract details

### GMON token (`con/src/GMON.sol`)

- Name/Symbol/Decimals: "GMON Token" / `GMON` / 18
- Initial supply: 10,000,000 GMON minted to the initial owner at deployment
- Ownership: uses `Ownable`; the initial owner is passed to the constructor
- Minting: owner can call `mint(address to, uint256 amount)` to create additional tokens

Key behaviors and events:

- ERC20 standard from OpenZeppelin; inherits standard `Transfer`, `Approval` events
- No burn function provided; supply is inflationary via `mint`

Security notes:

- Owner centralization: owner can expand supply; consumers should account for dilution risk

### SimpleSwapPool (`con/src/SimpleSwapPool.sol`)

- Assets: native chain currency (tracked as `reserveETH`) and `GMON` (`reserveGMON`)
- Fee: 0.3% (30 bps) on input amount, kept inside the pool (benefits liquidity/owner indirectly)
- Pricing: constant-product style amount out formula with fee applied to input

Formulas:

```text
amountInAfterFee = amountIn * (FEE_DENOM - FEE_BPS) / FEE_DENOM
amountOut = (amountInAfterFee * reserveOut) / (reserveIn + amountInAfterFee)
```

Core functions:

- `seedLiquidity(uint256 gmonAmount)` payable (owner-only): deposit native + GMON to initialize/increase reserves
- `withdraw(address to, uint256 ethAmount, uint256 gmonAmount)` (owner-only): withdraw part/all of reserves
- `swapExactETHForGMON(uint256 minGMONOut)` payable: swap native for GMON; reverts on slippage
- `swapExactGMONForETH(uint256 gmonIn, uint256 minETHOut)`: swap GMON for native; reverts on slippage

Events:

- `Seeded(uint256 ethAdded, uint256 gmonAdded)`
- `SwapETHForGMON(address user, uint256 ethIn, uint256 gmonOut)`
- `SwapGMONForETH(address user, uint256 gmonIn, uint256 ethOut)`
- `Withdrawn(address to, uint256 ethAmount, uint256 gmonAmount)`

Invariants and guards:

- Requires positive reserves to swap (`NO_LIQ`)
- Slippage protection via `min*Out` params (`SLIPPAGE`)
- Reentrancy protected (`ReentrancyGuard`)
- Safe token transfers (`SafeERC20`)

Limitations (by design, not production-ready):

- No LP shares; a single owner controls seeding and withdrawal
- No price oracles, TWAP, or front-running protection
- No support for multi-token pools or routing
- Fees are not distributable to LPs (since no LPs); they stay in the pool reserves

Operational assumptions:

- The owner is trusted to seed/withdraw responsibly
- Users must set appropriate `min*Out` to account for slippage

---

## Environment variables

Create a `.env` file in `con/` (same folder as `foundry.toml`) with values for your networks. Common variables:

```bash
# Example
RPC_URL="https://sepolia.infura.io/v3/<YOUR_KEY>"
PRIVATE_KEY="0x..."  # Use a funded test key only; never commit
```

Reference these in commands using `--rpc-url $RPC_URL --private-key $PRIVATE_KEY` or configure `foundry.toml` profiles.

---

## Deployment

The deployment entrypoint is `con/script/DeployAll.s.sol`.

Dry run (no broadcast):

```bash
cd con
forge script script/DeployAll.s.sol \
  --fork-url $RPC_URL \
  -vvvv
```

Broadcast to a network:

```bash
cd con
forge script script/DeployAll.s.sol \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast -vvvv
```

Artifacts and transaction logs will appear under `con/broadcast/DeployAll.s.sol/<chainId>/` and addresses can be retrieved from the run JSON files.

---

## Example usage with cast (CLI)

Prereqs: `anvil` running locally or a funded testnet key set in env.

1) Approve GMON to the pool (for swapping GMON→ETH):

```bash
cast send <GMON_ADDRESS> "approve(address,uint256)" <POOL_ADDRESS> 100000000000000000000 \
  --rpc-url $RPC_URL --private-key $PRIVATE_KEY
```

2) Seed liquidity (owner only): send native + GMON in a single call:

```bash
cast send <POOL_ADDRESS> "seedLiquidity(uint256)" 100000000000000000000 \
  --value 1000000000000000000 \
  --rpc-url $RPC_URL --private-key $PRIVATE_KEY
```

3) Swap 0.1 native for GMON with min out protection:

```bash
cast send <POOL_ADDRESS> "swapExactETHForGMON(uint256)" 1 \
  --value 100000000000000000 \
  --rpc-url $RPC_URL --private-key $PRIVATE_KEY
```

4) Swap 50 GMON for native with min out protection:

```bash
cast send <POOL_ADDRESS> "swapExactGMONForETH(uint256,uint256)" 50000000000000000000 1 \
  --rpc-url $RPC_URL --private-key $PRIVATE_KEY
```

Replace `<GMON_ADDRESS>` and `<POOL_ADDRESS>` with addresses from deployment logs in `con/broadcast/`.

---

## Interacting with contracts

ABIs are generated in `con/out/`. For example:

- `con/out/GMON.sol/GMON.json`
- `con/out/SimpleSwapPool.sol/SimpleSwapPool.json`

You can load these ABIs in scripts or a frontend to read/write via your preferred library (ethers.js, viem, web3.js, etc.).

---

## Frontend (WIP)

The repo includes Next.js config scaffolding at the root. If/when a `package.json` is present, the usual flow will be:

```bash
npm install
npm run dev
```

Until then, focus on the contracts in `con/`.

---

## Linting & formatting

- Solidity: follow Foundry defaults; consider `forge fmt` for formatting.
- JS/TS: lint config provided (`eslint.config.mjs`); run with your package script when available.

---

## Troubleshooting

- Missing artifacts: run `forge build` inside `con/`.
- RPC errors: verify `RPC_URL` is correct and the network is reachable.
- Insufficient funds: fund the `PRIVATE_KEY` on the target testnet.
- Permission errors on macOS: ensure your shell has access to developer tools and that Foundry binaries are on `PATH`.

---

## License

MIT. See `LICENSE` if/when added; otherwise, treat as MIT for now.
