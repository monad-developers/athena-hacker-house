import { DeFiBirdsGame } from '@/components/game/DeFiBirdsGame';

export default function Home() {
  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background">
      <div className="absolute top-10 left-10 h-20 w-40 rounded-full bg-white/70"></div>
      <div className="absolute top-20 right-20 h-24 w-48 rounded-full bg-white/70"></div>
      <div className="absolute top-40 left-1/4 h-16 w-32 rounded-full bg-white/70"></div>
      <DeFiBirdsGame />
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-[#65B234]">
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-[#8B4513] opacity-50"></div>
      </div>
    </main>
  );
}
