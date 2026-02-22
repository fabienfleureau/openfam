import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { UserMenu } from "@/components/UserMenu";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OpenFAM — The Smart Heart of Your Family's Network",
  description: "Next-generation parental control dashboard for OpenWrt routers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-background text-foreground font-sans selection:bg-mint/30 selection:text-white">
        {/* Navigation */}
        <nav className="fixed top-0 z-50 w-full border-b border-obsidian-border bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-6">
            <div className="flex items-center gap-2.5">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 border border-white/10 group-hover:border-mint/50 transition-colors">
                  <span className="text-lg">🛡️</span>
                </div>
                <h1 className="text-lg font-semibold tracking-tight text-white">OpenFAM</h1>
              </Link>
            </div>

            {/* Main Navigation */}
            <div className="hidden md:flex items-center bg-white/[0.03] border border-white/5 rounded-full px-1.5 py-1">
              {[
                { label: 'Dashboard', href: '/' },
                { label: 'Profiles', href: '/profiles' },
                { label: 'Devices', href: '/devices' },
                { label: 'Schedules', href: '/schedules' },
              ].map((link) => (
                <Link 
                  key={link.href}
                  href={link.href}
                  className="px-4 py-1.5 rounded-full text-xs font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            
            <div className="flex items-center gap-4">
              <a 
                href="https://github.com/fabienfleureau/openfam" 
                target="_blank" 
                rel="noreferrer"
                className="text-sm text-white/50 hover:text-white transition-colors"
              >
                GitHub
              </a>
              <UserMenu />
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="relative pt-14">
          <div className="mx-auto max-w-[1400px] px-6 py-10">
            {children}
          </div>
        </main>

        {/* Background Subtle Glow */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-mint/5 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-critical/5 blur-[120px]" />
        </div>
      </body>
    </html>
  );
}
