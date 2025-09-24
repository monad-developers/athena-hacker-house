import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mon-Aid",
  description: "Mon-Aid – Real-time disaster relief donations on Monad",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="w-full flex items-center justify-between gap-6 py-4 px-6 border-b border-black/[.08] dark:border-white/[.145]">
          <a href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Mon-Aid" width={36} height={36} className="rounded" />
            <span className="font-semibold tracking-tight">Mon-Aid</span>
          </a>
          <div className="flex items-center gap-6">
            <a href="/" className="hover:underline">Donate</a>
            <a href="/disasters" className="hover:underline">Disasters</a>
            <a href="/pitch" className="hover:underline">Pitch</a>
            <a href="/claims" className="hover:underline">Claims</a>
            <a href="/jury" className="hover:underline">Jury</a>
            <a href="/government" className="hover:underline">Government</a>
            <a href="/signin" className="hover:underline">Sign In</a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
