export default function DonorLanding() {
  return (
    <div className="font-sans max-w-3xl mx-auto p-8 grid gap-6">
      <div className="flex items-center gap-4">
        <img src="/logo.png" alt="Mon-Aid" width={64} height={64} className="rounded" />
        <div>
          <h1 className="text-2xl font-bold" style={{color:"var(--accent)"}}>Mon-Aid for Donors</h1>
          <p className="opacity-80">Give micro-donations that arrive in under a second. Fully transparent on Monad.</p>
        </div>
      </div>
      <div className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-5 bg-[#0f0f13]">
        <h2 className="font-semibold mb-2">How it works</h2>
        <ul className="list-disc ml-5 opacity-90 text-sm">
          <li>Pick a disaster region (Disasters tab) or paste Beneficiary ID.</li>
          <li>Donate as little as $0.01 equivalent; instant finality on Monad.</li>
          <li>All donations and disbursements are on-chain and auditable.</li>
        </ul>
        <a href="/" className="inline-block mt-4 rounded px-4 py-2" style={{background:"var(--accent)",color:"white"}}>Start Donating</a>
      </div>
    </div>
  );
}


