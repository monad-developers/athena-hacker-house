"use client";
import { useState } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function SignInPage() {
  const [address, setAddress] = useState<string>("");
  const [token, setToken] = useState<string>("");

  async function connect() {
    if (!(window as any).ethereum) return alert("No wallet installed");
    const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
    setAddress(accounts[0]);
  }

  async function signIn() {
    if (!address) return alert("Connect wallet first");
    const nonceRes = await fetch(`${BACKEND_URL}/api/auth/nonce?address=${address}`);
    const { message } = await nonceRes.json();
    const sig = await (window as any).ethereum.request({ method: 'personal_sign', params: [message, address] });
    const vr = await fetch(`${BACKEND_URL}/api/auth/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address, signature: sig, message }) });
    const data = await vr.json();
    if (data.token) { setToken(data.token); localStorage.setItem('monaid_token', data.token); alert('Signed in'); }
    else alert('Sign in failed');
  }

  return (
    <div className="font-sans max-w-5xl mx-auto p-8 grid gap-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded overflow-hidden"><img src="/logo.png" alt="Mon-Aid" className="h-full w-full object-cover"/></div>
        <div>
          <h1 className="text-2xl font-bold" style={{color:"var(--accent)"}}>Sign In</h1>
          <p className="opacity-80">Choose your portal: Donor or Government Official</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-5 bg-[#0f0f13]">
          <h2 className="font-semibold mb-2" style={{color:"var(--accent)"}}>Donor Portal</h2>
          <p className="text-sm opacity-80 mb-3">Donate instantly to verified relief wallets. No account required.</p>
          <div className="flex gap-3">
            <a className="rounded px-4 py-2" href="/donor" style={{background:"var(--accent)",color:"white"}}>Continue as Donor</a>
            <button className="rounded border px-4 py-2" onClick={connect}>Connect Wallet</button>
          </div>
        </div>
        <div className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-5 bg-[#0f0f13]">
          <h2 className="font-semibold mb-2" style={{color:"var(--accent)"}}>Government/Organizer Portal</h2>
          <p className="text-sm opacity-80 mb-3">Create disasters, manage approvals, and oversee distribution.</p>
          <div className="flex gap-3 items-center">
            <button className="rounded border px-4 py-2" onClick={connect}>{address? 'Wallet Connected' : 'Connect Wallet'}</button>
            <button className="rounded px-4 py-2" style={{background:"var(--accent)",color:"white"}} onClick={signIn}>Sign & Enter</button>
            <a className="underline ml-auto" href="/government">Open Dashboard</a>
          </div>
          {token && <div className="text-xs opacity-60 mt-2">Session: {token.slice(0,16)}…</div>}
        </div>
      </div>
    </div>
  );
}


