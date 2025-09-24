"use client";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
const RELIEF_CONTRACT = process.env.NEXT_PUBLIC_RELIEF_CONTRACT || "";

export default function Home() {
  const [beneficiaryId, setBeneficiaryId] = useState("CASE_FLOOD_2025_INDIA_NGO_1");
  const [amountUsd, setAmountUsd] = useState("1");
  const [stats, setStats] = useState<{ totalDonations: string; totalDisbursed: string; totalDonationCount: string; uniqueDonorCount: string; avgDonation: string } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const amountWei = useMemo(() => {
    // Placeholder: assume 1 token == 1 USD and 18 decimals
    try {
      const usd = Number(amountUsd || "0");
      const wei = BigInt(Math.round(usd * 1e18));
      return wei.toString();
    } catch {
      return "0";
    }
  }, [amountUsd]);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/stats`).then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    const url = BACKEND_URL.replace(/^http/, "ws") + "/ws";
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === "stats") setStats(data.payload);
      } catch {}
    };
    return () => ws.close();
  }, []);

  async function submitIntent(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`${BACKEND_URL}/api/donation-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ beneficiaryId, amountWei }),
    });
    try {
      if (!(window as any).ethereum) throw new Error("No wallet detected");
      const provider = new (await import("ethers")).BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const abi = [
        'function donate(bytes32 beneficiaryId) payable'
      ];
      const contract = new (await import("ethers")).Contract(RELIEF_CONTRACT, abi, signer);
      const id = (await import("ethers")).id(beneficiaryId);
      const tx = await contract.donate(id, { value: amountWei });
      await tx.wait();
      alert("Donation sent on-chain!");
    } catch (err:any) {
      console.warn(err);
      alert("Intent recorded. Wallet send skipped: " + (err?.message||""));
    }
  }

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start w-full max-w-xl">
        <div className="flex items-center gap-4">
          <Image src="/logo.png" alt="Mon-Aid" width={96} height={96} priority />
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{color:"var(--accent)"}}>Mon-Aid</h1>
            <p className="opacity-80">Real-time micro-donations on Monad L1</p>
          </div>
        </div>

        <div className="w-full rounded-xl border border-black/[.08] dark:border-white/[.145] p-4 bg-[#0f0f13]">
          <h2 className="font-semibold mb-3" style={{color:"var(--accent)"}}>Donate (Donor)</h2>
          <form className="flex flex-col gap-3" onSubmit={submitIntent}>
            <label className="text-sm">Beneficiary ID</label>
            <input className="border rounded px-3 py-2 bg-transparent" value={beneficiaryId} onChange={e => setBeneficiaryId(e.target.value)} />
            <label className="text-sm">Amount (USD)</label>
            <input className="border rounded px-3 py-2 bg-transparent" type="number" min="0.01" step="0.01" value={amountUsd} onChange={e => setAmountUsd(e.target.value)} />
            <button className="rounded px-4 py-2 mt-1" style={{background:"var(--accent)",color:"white"}} type="submit">Donate</button>
          </form>
          <p className="text-xs mt-2 opacity-70">Note: Demo converts USD→wei 1:1 for display. On-chain send happens via wallet integration in a later step.</p>
        </div>

        <div className="w-full rounded-xl border border-black/[.08] dark:border-white/[.145] p-4 bg-[#0f0f13]">
          <h2 className="font-semibold mb-3" style={{color:"var(--accent)"}}>Live Stats</h2>
          {stats ? (
            <ul className="text-sm grid grid-cols-2 gap-2">
              <li>Donors: <b>{stats.uniqueDonorCount}</b></li>
              <li>Tx Count: <b>{stats.totalDonationCount}</b></li>
              <li>Total Donated (wei): <b>{stats.totalDonations}</b></li>
              <li>Total Disbursed (wei): <b>{stats.totalDisbursed}</b></li>
              <li>Avg Donation (wei): <b>{stats.avgDonation}</b></li>
            </ul>
          ) : (
            <p className="text-sm opacity-70">Loading…</p>
          )}
        </div>
        <div className="text-sm opacity-80">
          Are you an official? <a className="underline" href="/government" style={{color:"var(--accent-2)"}}>Open the Government Dashboard</a> or <a className="underline" href="/signin" style={{color:"var(--accent-2)"}}>Sign in</a>.
        </div>
      </main>
    </div>
  );
}
