export default function PitchPage() {
  return (
    <div className="font-sans max-w-3xl mx-auto p-8 grid gap-6">
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="Mon-Aid" width={48} height={48} className="rounded"/>
        <h1 className="text-2xl font-bold" style={{color:'var(--accent)'}}>Mon-Aid – Real-Time Relief on Monad</h1>
      </div>
      <div className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-5 bg-[#0f0f13] leading-7">
        <p>
          In 2022, when floods devastated parts of Assam in Northeast India, millions of families were left stranded. I remember a story of Rina, a mother of two, who waited three days for help. Though international donors pledged millions, relief took weeks to trickle through banks and red tape.
        </p>
        <p className="mt-3">
          Now imagine if, while Rina was still stranded, people across the world could have sent $1 — even 50 cents — instantly into her phone wallet. Usable within seconds for food, medicine, or a bus ticket to safety. This is what Mon-Aid makes possible.
        </p>
        <ul className="list-disc ml-6 mt-3 opacity-90">
          <li>Micro-donations from $0.01, processed in under a second on Monad.</li>
          <li>Direct, transparent flows to verified victims and NGOs — on-chain, end-to-end.</li>
          <li>Government + community validation to stop fraud before funds move.</li>
          <li>Gamified donation modes make giving inclusive and engaging.</li>
        </ul>
        <p className="mt-3">
          Mon-Aid turns global goodwill into real-time lifelines. With Monad’s parallel execution, ultra-low fees, and instant finality, help arrives when it matters most — now.
        </p>
        <p className="mt-3 italic opacity-90">With Monad’s power, we’re building a future where no mother like Rina waits days for help. She can get it in seconds.</p>
      </div>
      <div className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-5 bg-[#0f0f13]">
        <h2 className="font-semibold" style={{color:'var(--accent)'}}>Why Monad</h2>
        <ul className="list-disc ml-6 mt-2 text-sm opacity-90">
          <li>Parallel execution handles 10k+ TPS surges during crises.</li>
          <li>Ultra-low fees make $0.01 donations viable globally.</li>
          <li>Instant finality ensures funds arrive and are usable immediately.</li>
          <li>Transparent, immutable records keep trust high and corruption low.</li>
        </ul>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <img src="/ui1.png" alt="UI concept 1" className="w-full rounded-lg border border-black/[.08] dark:border-white/[.145]"/>
        <img src="/ui5.png" alt="UI concept 5" className="w-full rounded-lg border border-black/[.08] dark:border-white/[.145]"/>
      </div>
    </div>
  );
}


