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
  title: "Kalkulator Keuangan & SPJ Perjalanan Dinas - Inspektorat",
  description: "Aplikasi Kalkulator Keuangan, Perhitungan SBM 2026, Rekap 48 Kolom, dan Pembuatan Dokumen SPJ",
  icons: {
    icon: "/logo-kemenkopangan.png",
    shortcut: "/logo-kemenkopangan.png",
    apple: "/logo-kemenkopangan.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
