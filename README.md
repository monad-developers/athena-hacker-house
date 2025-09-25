# athena-hacker-house
<video controls muted playsinline loop width="720">
  <source src="public/demo.mp4" type="video/mp4" />
  Your browser does not support the video tag. Here is a <a href="public/demo.mp4">link to the video</a>.
</video>
Monad Mines (3x3) — Next.js + TypeScript
=================================================

Play a simple 3x3 Mines-style game. Find the 💎 within 3 tries to trigger a simulated "Swap on Monad" via a Next.js API route.

Tech stack
---------------------------------
- **Frontend**: React (Next.js App Router)
- **Language**: TypeScript
- **API**: Next.js Route Handler (`/api/swap`)

Getting started
---------------------------------
1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the dev server:

   ```bash
   npm run dev
   ```

3. Open `http://localhost:3000` in your browser.

How it works
---------------------------------
- The board is a 3x3 grid. A random cell is selected to contain the diamond on each reset.
- You have 3 tries. Click a cell to reveal:
  - Hidden → ❓
  - Miss → ❌
  - Diamond → 💎
- If you find the diamond within 3 clicks, the app calls `POST /api/swap` to simulate a swap on the Monad chain and returns a fake `txHash`.

Project structure
---------------------------------
- `src/app/page.tsx`: Game UI and logic, triggers the swap on win.
- `src/app/api/swap/route.ts`: Simulated Monad swap endpoint.
- `src/app/layout.tsx`, `src/app/globals.css`: App shell and styles.

Notes
---------------------------------
- The swap is simulated; integrate a real Monad SDK or RPC to perform an actual on-chain swap.
- Reset the game anytime with the Reset button.
# monad-mines
