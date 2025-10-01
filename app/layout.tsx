// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import Providers from "./components/Providers";

// Bricolage Grotesque font
const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-bricolage",
});

const APP_NAME = "Blind Dice Swap";
const APP_DEFAULT_TITLE = "Blind Dice Swap";
const APP_TITLE_TEMPLATE = "Blind Dice Swap";
const APP_DESCRIPTION = "Blind Dice Swap - Swap Like a Pro";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_DEFAULT_TITLE,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "transparent" },
    { media: "(prefers-color-scheme: dark)", color: "transparent" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bricolageGrotesque.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
