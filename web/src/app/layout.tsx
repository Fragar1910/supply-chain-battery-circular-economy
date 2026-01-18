import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Web3Provider } from "@/lib/Web3Context";
import { Toaster } from "sonner";
import { ClearCacheButton } from "@/components/dev/ClearCacheButton";
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
  title: "Battery Circular Economy - Traceability Platform",
  description: "EU Battery Passport compliant traceability platform for circular battery economy",
};

// Toast options - MOVED OUTSIDE to prevent re-creation on every render
const TOAST_OPTIONS = {
  style: {
    background: 'rgb(15 23 42)',
    border: '1px solid rgb(51 65 85)',
    color: 'rgb(226 232 240)',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Web3Provider>
          {children}
          <Toaster
            position="bottom-right"
            theme="dark"
            richColors
            closeButton
            toastOptions={TOAST_OPTIONS}
          />
          <ClearCacheButton />
        </Web3Provider>
      </body>
    </html>
  );
}
