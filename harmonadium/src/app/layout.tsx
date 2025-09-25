import type { Metadata } from "next";
import { New_Rocker, Montserrat } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { Toaster } from 'sonner';

const newRocker = New_Rocker({
  variable: "--font-new-rocker",
  subsets: ["latin"],
  weight: "400",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Harmonad - Musical DeFi Trading",
  description: "Revolutionary DeFi trading controlled by your MacBook's lid angle with musical feedback",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${newRocker.variable} ${montserrat.variable} antialiased`}
      >
        <Providers>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
