import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/navbar";
import "./globals.css";

const serif = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const sans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KM Zero — Prodotti Locali a Chilometro Zero | La tua spesa dal produttore",
  description: "Ordina frutta, verdura, formaggi e molto altro direttamente dai produttori locali. Consegna settimanale nei punti di ritiro. Fresco, locale, sostenibile.",
  icons: {
    icon: "/images/generated/logo-km0.webp",
  },
  openGraph: {
    title: "KM Zero — La tua spesa dal produttore",
    description: "Ordina frutta, verdura, formaggi e molto altro direttamente dai produttori locali. Consegna settimanale nei punti di ritiro vicino a te.",
    images: "/images/generated/hero-landing.webp",
    url: "https://km-zero-eight.vercel.app",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${serif.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
