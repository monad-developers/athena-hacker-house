'use client';

import { Button } from '@/components/ui/button';
import { History, Map, HelpCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ANGLE_TO_TOKEN_MAPPING } from '@/lib/config';

interface SwapEvent {
  id: string;
  timestamp: number;
  angle: number;
  token: string;
  success: boolean;
  txHash?: string;
}

interface FloatingNavbarProps {
  swapHistory: SwapEvent[];
  currentAngle: number | null;
}

export function FloatingNavbar({ swapHistory, currentAngle }: FloatingNavbarProps) {
  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md rounded-full px-6 py-3 shadow-lg border border-white/20">
        {/* Logo */}
        <div className="flex items-center gap-2">
          {/* <img
            src="/Harmonad.png"
            alt="Harmonad"
            className="h-8 w-auto"
          /> */}
          <span className="font-primary text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Harmonad
          </span>
        </div>

        {/* Navbar Buttons */}
        <div className="flex items-center gap-2 ml-4">
          {/* History Modal */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-full hover:bg-primary hover:text-black transition-all duration-200">
                <History className="h-4 w-4 mr-2" />
                History
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-primary text-xl">Swap History 📈</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {swapHistory.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-secondary">No swaps yet! 😴</p>
                    <p className="text-sm mt-1">Start vibing with your lid angle 🔥</p>
                  </div>
                ) : (
                  swapHistory.map((swap) => (
                    <Card key={swap.id} className="p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="font-secondary">
                          <div className="font-medium">
                            {swap.angle.toFixed(1)}° → {swap.token}
                            <span className="ml-2">{swap.success ? '🎯' : '💀'}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(swap.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <Badge variant={swap.success ? 'default' : 'destructive'}>
                          {swap.success ? 'Success' : 'Failed'}
                        </Badge>
                      </div>
                      {swap.txHash && (
                        <div className="text-xs font-mono text-muted-foreground mt-2 truncate bg-muted p-2 rounded">
                          {swap.txHash}
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Angle Mapping Modal */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-full hover:bg-primary hover:text-black transition-all duration-200">
                <Map className="h-4 w-4 mr-2" />
                Angles
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-primary text-xl">Angle Mapping 🎯</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                {Object.entries(ANGLE_TO_TOKEN_MAPPING).map(([range, token]) => {
                  const [min, max] = range.split('-').map(Number);
                  const isActive = currentAngle && currentAngle >= min && currentAngle <= max;

                  return (
                    <Card
                      key={range}
                      className={`p-4 transition-all duration-300 ${
                        isActive
                          ? 'bg-primary/10 border-primary ring-2 ring-primary/20 shadow-md'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex justify-between items-center font-secondary">
                        <div>
                          <div className={`font-medium ${isActive ? 'text-primary' : ''}`}>
                            {token.symbol}
                            {isActive && <span className="ml-2 text-xs">🔥 ACTIVE</span>}
                          </div>
                          <div className={`text-sm ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                            {range}°
                            {isActive && currentAngle && (
                              <span className="ml-2 font-medium">
                                (Now: {currentAngle.toFixed(1)}°)
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant={isActive ? 'default' : 'secondary'}
                          className={isActive ? 'animate-pulse bg-primary' : ''}
                        >
                          {token.symbol}
                        </Badge>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>

          {/* How to Play Modal */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-full hover:bg-primary hover:text-black transition-all duration-200">
                <HelpCircle className="h-4 w-4 mr-2" />
                How to Play
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-primary text-xl">How to Play 🎮</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 font-secondary">
                <Card className="p-4 bg-gradient-to-r from-primary/5 to-primary/10">
                  <h3 className="font-semibold text-lg mb-2">The Vibe Check ✨</h3>
                  <p className="text-sm text-muted-foreground">
                    Your MacBook lid angle controls token swaps. It&apos;s giving main character energy 💅
                  </p>
                </Card>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <h4 className="font-medium">Connect Your Wallet 🦄</h4>
                      <p className="text-sm text-muted-foreground">Sign once and you&apos;re golden. No cap.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <h4 className="font-medium">Adjust That Angle 📐</h4>
                      <p className="text-sm text-muted-foreground">Open/close your MacBook lid. Different angles = different tokens. It&apos;s giving precision queen.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <h4 className="font-medium">Wait for the Magic ⏰</h4>
                      <p className="text-sm text-muted-foreground">Hold steady for 3 seconds. The countdown is aesthetic af.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
                    <div>
                      <h4 className="font-medium">Automatic Swap 🚀</h4>
                      <p className="text-sm text-muted-foreground">No clicking, no stress. Just pure automation vibes.</p>
                    </div>
                  </div>
                </div>

                <Card className="p-4 bg-yellow-50 border-yellow-200">
                  <h4 className="font-medium text-yellow-800 mb-1">Pro Tip 🧠</h4>
                  <p className="text-xs text-yellow-700">
                    Check the angle mapping to see which tokens are assigned to which angles.
                    It&apos;s giving strategy game realness.
                  </p>
                </Card>

                <div className="text-center pt-2">
                  <p className="text-xs text-muted-foreground">
                    Built different on Monad Testnet 🔥
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}