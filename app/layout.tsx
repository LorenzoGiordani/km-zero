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
  title: "KM Zero — Prodotti Locali, Consegna Settimanale",
  description: "Ordina direttamente da produttori locali. Frutta, verdura, formaggi, miele e molto altro. Ritira presso i punti di consegna nella tua zona.",
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
      <body className="min-h-full flex flex-col font-sans bg-stone-50 text-stone-800">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
