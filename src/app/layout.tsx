import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import WalletProviders from "../providers/WalletProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Monad Mines",
  description: "Swap on Monad with a Mines Game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${spaceGrotesk.variable} text-[var(--foreground)] bg-[var(--background)] min-h-svh antialiased`}>
        <WalletProviders>
          <div className="relative min-h-svh">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-monad-gradient [background-size:100%_100%,100%_100%,100%_100%]" />
            <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
            {children}
          </div>
        </WalletProviders>
      </body>
    </html>
  );
}
