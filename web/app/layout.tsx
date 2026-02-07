import type { Metadata } from "next";
import "./globals.css";

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
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
