"use client";
import { useState } from "react";

export default function JuryPage() {
  const [claimId, setClaimId] = useState("");
  const [decision, setDecision] = useState<"yes"|"no">("yes");

  return (
    <div className="font-sans flex flex-col items-center p-8 gap-6">
      <h1 className="text-xl font-semibold">Jury Voting</h1>
      <div className="w-full max-w-xl border rounded-xl p-4 border-black/[.08] dark:border-white/[.145]">
        <label className="text-sm">Claim ID (bytes32)</label>
        <input className="border rounded px-3 py-2 bg-transparent w-full" value={claimId} onChange={e => setClaimId(e.target.value)} placeholder="KERALA_FLOOD_2026|CLAIM_1 (hashed)" />
        <div className="flex gap-3 mt-3 items-center">
          <button className={`rounded px-4 py-2 ${decision==='yes'?'bg-foreground text-background':'border'}`} onClick={()=>setDecision('yes')}>Approve</button>
          <button className={`rounded px-4 py-2 ${decision==='no'?'bg-foreground text-background':'border'}`} onClick={()=>setDecision('no')}>Reject</button>
        </div>
        <p className="text-xs mt-3 opacity-70">Note: Hook this to wallet to call JuryStaking.vote(claimId, approve) and finalize once quorum is reached.</p>
      </div>
    </div>
  );
}


