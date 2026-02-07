"use client";

import { ThemeProvider } from "@/app/providers";
import { ThemeSelector } from "@/components/theme-selector";
import { StatusCard } from "@/components/status-card";
import { ChartPlaceholder } from "@/components/chart-placeholder";
import { ConnectedDevicesTable } from "@/components/connected-devices-table";
import {
  Router,
  Wifi,
  Shield,
  Clock,
  Cpu,
  HardDrive,
  Activity,
  Users,
} from "lucide-react";

export default function RouterHealthPage() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="theme-border border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-accent/10">
                  <Router className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h1 className="font-display text-xl">Open-F.A.M.</h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    The smart heart of your family's network
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span>FAM-9923</span>
                </div>
                <ThemeSelector />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Title */}
          <div className="mb-8 opacity-0 animate-fade-in">
            <h2 className="font-display text-3xl mb-2">Router Health</h2>
            <p className="text-muted-foreground">
              Monitor your network status and connected devices
            </p>
          </div>

          {/* Status Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatusCard
              title="Uptime"
              value="14"
              unit="days"
              icon={Clock}
              status="online"
              trend={{ value: 2, up: true }}
              delay={100}
            />
            <StatusCard
              title="Connected Devices"
              value="5"
              unit="active"
              icon={Users}
              status="online"
              delay={200}
            />
            <StatusCard
              title="DNS Queries"
              value="2.4"
              unit="K"
              icon={Activity}
              status="online"
              trend={{ value: 12, up: true }}
              delay={300}
            />
            <StatusCard
              title="Threats Blocked"
              value="0"
              icon={Shield}
              status="neutral"
              delay={400}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <ChartPlaceholder
              title="Network Traffic"
              subtitle="Last 24 hours"
              dataPoints={24}
              delay={500}
            />
            <ChartPlaceholder
              title="DNS Queries"
              subtitle="Queries per hour"
              dataPoints={24}
              delay={600}
            />
          </div>

          {/* Resource Usage Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="theme-card p-6 opacity-0 animate-fade-in-up animation-delay-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-md bg-muted/50 text-info">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CPU Usage</p>
                  <p className="text-2xl font-display font-semibold">12%</p>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-info rounded-full transition-all duration-500"
                  style={{ width: "12%" }}
                />
              </div>
            </div>

            <div className="theme-card p-6 opacity-0 animate-fade-in-up animation-delay-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-md bg-muted/50 text-accent">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Memory</p>
                  <p className="text-2xl font-display font-semibold">
                    128 <span className="text-sm text-muted-foreground">MB</span>
                  </p>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: "32%" }}
                />
              </div>
            </div>

            <div className="theme-card p-6 opacity-0 animate-fade-in-up animation-delay-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-md bg-muted/50 text-success">
                  <Wifi className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Signal</p>
                  <p className="text-2xl font-display font-semibold">
                    Excellent
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex-1 h-8 rounded-sm bg-success"
                    style={{
                      opacity: i === 4 ? 0.6 : 1,
                      height: `${i * 6}px`,
                      marginTop: `${(4 - i) * 8}px`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Connected Devices Table */}
          <ConnectedDevicesTable />
        </main>

        {/* Footer */}
        <footer className="theme-border border-t mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
              <p>
                Open-F.A.M. v0.1.0 — Parental Control for OpenWrt Routers
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="hover:text-foreground transition-colors">
                  Documentation
                </a>
                <a href="#" className="hover:text-foreground transition-colors">
                  Support
                </a>
                <a href="#" className="hover:text-foreground transition-colors">
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}
