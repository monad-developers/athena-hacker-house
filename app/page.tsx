import type { Metadata } from "next";
import DiceSwap from "./components/DiceSwap";
import Image from "next/image";
import Header from "./components/header"; // import your new header

export const metadata: Metadata = {
  title: "Home",
};

export default function Home() {
  return (
    <div className="min-h-screen relative bg-slate-900">
      {/* Background Image */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/hero-bg.jpg"
          alt="Abstract blockchain background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Header with Privy login */}
      <Header />

      {/* Main Content */}
      <div className="max-h-screen mb-6 mx-auto  px-6 py-32 relative z-10">
        <div className="backdrop-blur-lg bg-white/10 dark:bg-slate-800/30 rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
             BLIND BLIND BLIND
            </h1>
            <p className="mt-4 text-lg text-white/80">
              a random blind swapper for the genz generation 
            </p>
          </div>

          <div className="mb-8">
            <DiceSwap />
          </div>
        </div>
      </div>
    </div>
  );
}
