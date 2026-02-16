import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { UserMenu } from "@/components/UserMenu";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Open-F.A.M. - The Smart Heart of Your Family's Network",
  description: "Parental control dashboard for network management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="signal-atlas">
      <body className={`${inter.variable} min-h-screen bg-background text-foreground font-sans`}>
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🛡️</span>
              <h1 className="text-xl font-bold text-white">Open-F.A.M.</h1>
            </div>
            <UserMenu />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
