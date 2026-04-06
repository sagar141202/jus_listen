import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { PlayerProvider } from "@/components/providers/PlayerProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "tuniq - Your music. No limits. No ads.",
  description:
    "A self-hosted, ad-free music streaming web app. Stream millions of songs without commercial interruption.",
  keywords: [
    "music",
    "streaming",
    "ad-free",
    "youtube music",
    "self-hosted",
    "audio",
    "playlist",
  ],
  authors: [{ name: "Sagar Maddi" }],
  creator: "Sagar Maddi",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "tuniq - Your music. No limits. No ads.",
    description:
      "A self-hosted, ad-free music streaming web app. Stream millions of songs without commercial interruption.",
    type: "website",
    locale: "en_US",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body
        className="antialiased min-h-screen font-sans"
        suppressHydrationWarning
      >
        <PlayerProvider>{children}</PlayerProvider>
      </body>
    </html>
  );
}
