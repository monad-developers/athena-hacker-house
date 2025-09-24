"use client";
import { useState } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function ClaimsPage() {
  const [beneficiaryId, setBeneficiaryId] = useState("");
  const [wallet, setWallet] = useState("");
  const [disasterId, setDisasterId] = useState("KERALA_FLOOD_2026");
  const [userUniqueHash, setUserUniqueHash] = useState("");
  const [docHash, setDocHash] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`${BACKEND_URL}/api/claim-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ beneficiaryId, wallet, disasterId, userUniqueHash, docHash }),
    });
    if (res.ok) alert("Claim submitted intent recorded. Next: send tx to BeneficiaryRegistry.");
  }

  return (
    <div className="font-sans flex flex-col items-center p-8 gap-6">
      <h1 className="text-xl font-semibold">Submit Claim</h1>
      <form className="w-full max-w-xl flex flex-col gap-3 border rounded-xl p-4 border-black/[.08] dark:border-white/[.145]" onSubmit={submit}>
        <label className="text-sm">Beneficiary ID (bytes32 key)</label>
        <input className="border rounded px-3 py-2 bg-transparent" value={beneficiaryId} onChange={e => setBeneficiaryId(e.target.value)} placeholder="e.g. KERALA_FLOOD_2026_CLAIM_1" />

        <label className="text-sm">Wallet Address</label>
        <input className="border rounded px-3 py-2 bg-transparent" value={wallet} onChange={e => setWallet(e.target.value)} placeholder="0x..." />

        <label className="text-sm">Disaster ID</label>
        <input className="border rounded px-3 py-2 bg-transparent" value={disasterId} onChange={e => setDisasterId(e.target.value)} />

        <label className="text-sm">User Unique Hash (KYC hash)</label>
        <input className="border rounded px-3 py-2 bg-transparent" value={userUniqueHash} onChange={e => setUserUniqueHash(e.target.value)} placeholder="hash(userId)" />

        <label className="text-sm">Document Manifest Hash (IPFS/Arweave)</label>
        <input className="border rounded px-3 py-2 bg-transparent" value={docHash} onChange={e => setDocHash(e.target.value)} placeholder="ipfs://... (hashed)" />

        <button className="rounded bg-foreground text-background px-4 py-2 mt-1" type="submit">Submit Claim</button>
      </form>
    </div>
  );
}


