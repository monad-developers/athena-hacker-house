"use client";
import { useEffect, useState } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function GovernmentPage() {
  const [token, setToken] = useState<string | null>(null);
  const [form, setForm] = useState({ id: "", name: "", region: "", description: "", beneficiaryId: "" });

  useEffect(() => {
    setToken(localStorage.getItem('monaid_token'));
  }, []);

  async function addDisaster(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`${BACKEND_URL}/api/disasters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth': token || '' },
      body: JSON.stringify(form),
    });
    if (res.ok) { setForm({ id: "", name: "", region: "", description: "", beneficiaryId: "" }); alert('Added'); }
    else alert('Failed (sign in as official on /signin)');
  }

  return (
    <div className="font-sans flex flex-col items-center p-8 gap-6">
      <h1 className="text-xl font-semibold">Government Dashboard</h1>
      <div className="w-full max-w-xl border rounded-xl p-4 border-black/[.08] dark:border-white/[.145]">
        <p className="text-sm mb-3">Create disasters and manage approvals. Sign in at <a className="underline" href="/signin">/signin</a>.</p>
        <form className="flex flex-col gap-3" onSubmit={addDisaster}>
          <input className="border rounded px-3 py-2 bg-transparent" placeholder="ID" value={form.id} onChange={e=>setForm({...form, id:e.target.value})} />
          <input className="border rounded px-3 py-2 bg-transparent" placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
          <input className="border rounded px-3 py-2 bg-transparent" placeholder="Region" value={form.region} onChange={e=>setForm({...form, region:e.target.value})} />
          <input className="border rounded px-3 py-2 bg-transparent" placeholder="Description" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
          <input className="border rounded px-3 py-2 bg-transparent" placeholder="Beneficiary ID (bytes32 key)" value={form.beneficiaryId} onChange={e=>setForm({...form, beneficiaryId:e.target.value})} />
          <button className="rounded bg-foreground text-background px-4 py-2" type="submit">Add Disaster</button>
        </form>
      </div>
    </div>
  );
}


