"use client";
import { useEffect, useRef, useState } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function DisastersPage() {
  const [items, setItems] = useState<Array<{id:string; name:string; region:string; description:string; beneficiaryId:string; createdAt:number}>>([]);
  const [form, setForm] = useState({ id: "", name: "", region: "", description: "", beneficiaryId: "" });
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/disasters`).then(r=>r.json()).then(d=>setItems(d.items||[])).catch(()=>{});
    const url = BACKEND_URL.replace(/^http/, "ws") + "/ws";
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === 'disasters') setItems(data.payload.items||[]);
      } catch {}
    };
    return () => ws.close();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`${BACKEND_URL}/api/disasters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': (process.env.NEXT_PUBLIC_ADMIN_KEY||'') },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ id: "", name: "", region: "", description: "", beneficiaryId: "" });
    } else {
      alert('Failed to add (admin key missing/invalid)');
    }
  }

  return (
    <div className="font-sans max-w-4xl mx-auto p-6 flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Disasters</h1>
      <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-2 gap-3 border rounded-xl p-4 border-black/[.08] dark:border-white/[.145]">
        <input className="border rounded px-3 py-2 bg-transparent" placeholder="ID (e.g., KERALA_FLOOD_2026)" value={form.id} onChange={e=>setForm({...form, id:e.target.value})} />
        <input className="border rounded px-3 py-2 bg-transparent" placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
        <input className="border rounded px-3 py-2 bg-transparent" placeholder="Region" value={form.region} onChange={e=>setForm({...form, region:e.target.value})} />
        <input className="border rounded px-3 py-2 bg-transparent md:col-span-2" placeholder="Description" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
        <input className="border rounded px-3 py-2 bg-transparent md:col-span-2" placeholder="Beneficiary ID (bytes32 key)" value={form.beneficiaryId} onChange={e=>setForm({...form, beneficiaryId:e.target.value})} />
        <button className="rounded bg-foreground text-background px-4 py-2 md:col-span-2" type="submit">Add</button>
      </form>
      <ul className="grid gap-3">
        {items.map(it => (
          <li key={it.id} className="border rounded-xl p-4 border-black/[.08] dark:border-white/[.145]">
            <div className="font-medium">{it.name} — {it.region}</div>
            <div className="text-sm opacity-80 mt-1">{it.description}</div>
            <div className="text-xs opacity-60 mt-1">Beneficiary: {it.beneficiaryId}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}


