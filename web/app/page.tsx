'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Activity, 
  Users, 
  Clock, 
  Smartphone, 
  Lock, 
  Zap,
  Github,
  ChevronRight,
  Monitor,
  Wifi,
  Timer,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-32 pb-20">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center text-center pt-20 pb-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mint/10 border border-mint/20 text-mint text-[10px] font-mono uppercase tracking-[0.2em] mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mint opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-mint"></span>
          </span>
          Next-Gen Parental Control
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-8xl font-bold tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 leading-[0.9]"
        >
          The smart heart of <br /> your family&apos;s network.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-white/40 max-w-2xl mb-12 leading-relaxed px-4"
        >
          OpenFAM is a high-performance parental control system designed for OpenWrt. 
          Standalone CLI, Lightweight Agent, and a beautiful Obsidian dashboard.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4 px-4"
        >
          <Link href="/signup" className="btn-primary flex items-center gap-2 px-8 py-4 text-base">
            Get Started <ChevronRight size={20} />
          </Link>
          <a 
            href="https://github.com/fabienfleureau/openfam" 
            target="_blank" 
            rel="noreferrer"
            className="btn-secondary flex items-center gap-2 px-8 py-4 text-base group"
          >
            <Github size={20} /> 
            View on GitHub
            <ArrowUpRight size={16} className="text-white/20 group-hover:text-white transition-colors" />
          </a>
        </motion.div>
      </section>

      {/* Live Preview / Bento Grid */}
      <section className="relative px-4">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Main Network Health */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-[2] glass-card p-8 min-h-[400px] flex flex-col justify-between overflow-hidden group"
            >
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-mint animate-pulse shadow-[0_0_10px_#22C55E]" />
                    <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Router Live State</span>
                  </div>
                  <h3 className="text-3xl font-bold tracking-tight">System Healthy</h3>
                  <p className="text-white/40 text-sm mt-1">Uptime: 14 days, 2 hours • Load: 0.12</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold font-mono tracking-tighter text-mint">1.2 Gbps</div>
                  <div className="text-[10px] font-mono text-white/20 uppercase">Network Throughput</div>
                </div>
              </div>

              <div className="mt-12 flex items-end gap-1.5 h-40 relative z-10">
                {[30, 45, 35, 60, 80, 55, 40, 90, 70, 50, 45, 65, 85, 40, 30, 55, 75, 95, 60, 40, 50, 70, 45, 30].map((h, i) => (
                  <motion.div 
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 1.5, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
                    className={`flex-1 rounded-t-[2px] ${h > 80 ? 'bg-mint' : 'bg-white/10'}`}
                  />
                ))}
              </div>
              
              <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-mint/5 blur-[100px] rounded-full group-hover:bg-mint/10 transition-colors duration-700" />
            </motion.div>

            {/* Profile Quick Switch */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1 glass-card p-8 flex flex-col justify-between"
            >
              <div>
                <h4 className="text-xs font-mono text-white/30 uppercase tracking-[0.2em] mb-6">Family Profiles</h4>
                <div className="space-y-4">
                  {[
                    { name: 'Soren', mode: 'Homework', icon: <Timer size={14} />, color: 'text-safety' },
                    { name: 'Emma', mode: 'Focus', icon: <Lock size={14} />, color: 'text-critical' },
                    { name: 'Guest', mode: 'Restricted', icon: <Shield size={14} />, color: 'text-white/20' }
                  ].map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group/item">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover/item:text-white transition-colors">
                          <Users size={18} />
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{p.name}</div>
                          <div className={`text-[10px] flex items-center gap-1 ${p.color}`}>
                            {p.icon} {p.mode}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-white/10 group-hover/item:text-white transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
              
              <button className="w-full btn-secondary text-xs mt-8">Manage All Profiles</button>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Quick Stats */}
            {[
              { label: 'Active Devices', val: '12', sub: '+2 today', color: 'text-mint' },
              { label: 'Blocked Threats', val: '142', sub: 'Last 7 days', color: 'text-critical' },
              { label: 'Requests', val: '3', sub: 'Pending approval', color: 'text-safety' },
              { label: 'Data Usage', val: '42GB', sub: 'This month', color: 'text-white' },
            ].map((s, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6"
              >
                <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-2">{s.label}</div>
                <div className={`text-3xl font-bold font-mono tracking-tighter ${s.color}`}>{s.val}</div>
                <div className="text-[10px] text-white/20 mt-1">{s.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Showcase */}
      <section className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold tracking-tight mb-4">Everything you need. <br /> Nothing you don&apos;t.</h2>
          <p className="text-white/40 max-w-xl mx-auto">Enterprise networking power, simplified for the modern household.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-mint/10 border border-mint/20 flex items-center justify-center text-mint">
              <Shield size={24} />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white">Zero-Trust by Default</h3>
            <p className="text-sm text-white/40 leading-relaxed">
              New MAC addresses are quarantined immediately. Redirected to a secure portal, they must be approved and assigned before accessing your network.
            </p>
            <ul className="space-y-2 pt-2">
              {['Automatic Isolation', 'Captive Portal Claiming', 'Parental Approval Queue'].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-white/60">
                  <CheckCircle2 size={14} className="text-mint" /> {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-safety/10 border border-safety/20 flex items-center justify-center text-safety">
              <Activity size={24} />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white">Dynamic Mode Switching</h3>
            <p className="text-sm text-white/40 leading-relaxed">
              Switch entire network profiles in milliseconds. Link MAC addresses to NextDNS IDs and swap them based on time-based schedules.
            </p>
            <ul className="space-y-2 pt-2">
              {['NextDNS Integration', 'Custom Schedules', 'One-Tap Panic Mode'].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-white/60">
                  <CheckCircle2 size={14} className="text-safety" /> {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-critical/10 border border-critical/20 flex items-center justify-center text-critical">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white">Lightweight & Fast</h3>
            <p className="text-sm text-white/40 leading-relaxed">
              No heavy binaries or runtimes on your router. OpenFAM uses native POSIX Ash and jq, keeping your router performance at its peak.
            </p>
            <ul className="space-y-2 pt-2">
              {['Zero-Runtime Agent', 'JSON-based State', 'Minimal CPU/RAM Impact'].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-white/60">
                  <CheckCircle2 size={14} className="text-critical" /> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Architecture Visual */}
      <section className="relative py-24">
        <div className="max-w-5xl mx-auto px-6 glass-card p-12 overflow-hidden border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Designed for <br /> OpenWrt routers.</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex-shrink-0 flex items-center justify-center text-white/40">1</div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">State Polling Architecture</h4>
                    <p className="text-xs text-white/40">The router pulls configuration every minute. No incoming ports needed, keeping your network invisible to the outside.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex-shrink-0 flex items-center justify-center text-white/40">2</div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Multi-Plugin Engine</h4>
                    <p className="text-xs text-white/40">Extend functionality with plugins for DNS, NFTables, OpenAppFilter, and Captive Portals.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex-shrink-0 flex items-center justify-center text-white/40">3</div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Atomic Deployments</h4>
                    <p className="text-xs text-white/40">Configuration updates are atomic. No half-baked rules or broken network states during updates.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-white/5 border border-white/10 p-8 flex flex-col justify-center items-center gap-8 group">
                <div className="flex items-center justify-center gap-12">
                  <div className="flex flex-col items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                    <Monitor className="text-mint" size={32} />
                    <span className="text-[10px] font-mono">Web UI</span>
                  </div>
                  <div className="h-px w-12 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <div className="flex flex-col items-center gap-2">
                    <Shield className="text-white" size={48} />
                    <span className="text-xs font-bold font-mono">CONFIG.JSON</span>
                  </div>
                  <div className="h-px w-12 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <div className="flex flex-col items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                    <Wifi className="text-safety" size={32} />
                    <span className="text-[10px] font-mono">Router</span>
                  </div>
                </div>
                
                <div className="w-full space-y-3 pt-4 border-t border-white/5">
                  <div className="flex justify-between items-center text-[10px] font-mono text-white/20">
                    <span>Synchronizing...</span>
                    <span>98%</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      animate={{ x: ['-100%', '100%'] }} 
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      className="h-full w-1/3 bg-gradient-to-r from-transparent via-mint to-transparent" 
                    />
                  </div>
                </div>
              </div>
              
              {/* Background glow for the graphic */}
              <div className="absolute inset-0 -z-10 bg-mint/5 blur-[80px] rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* GitHub CTA */}
      <section className="max-w-4xl mx-auto px-6 text-center">
        <div className="glass-card p-12 relative overflow-hidden bg-gradient-to-b from-white/[0.05] to-transparent">
          <div className="relative z-10 flex flex-col items-center">
            <div className="h-16 w-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-8">
              <Github size={32} />
            </div>
            <h2 className="text-4xl font-bold tracking-tight mb-4">Open Source. Always.</h2>
            <p className="text-white/40 mb-10 max-w-xl mx-auto text-lg leading-relaxed">
              OpenFAM is free, transparent, and built by the community. Audit the code, contribute features, or deploy your own instances without limits.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="https://github.com/fabienfleureau/openfam" 
                target="_blank" 
                rel="noreferrer"
                className="btn-primary flex items-center gap-2 px-8 py-4"
              >
                Join the Discussion
              </a>
              <div className="flex items-center gap-8 px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-mint" /> 
                  <span className="font-medium">Active Builds</span>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-safety" /> 
                  <span className="font-medium">Secure Core</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="absolute -bottom-24 -left-24 p-4 opacity-[0.03]">
            <Github size={400} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-[1400px] mx-auto px-6 pt-20 pb-10 border-t border-white/5">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-white/10 border border-white/10">
                <span className="text-xs">🛡️</span>
              </div>
              <h1 className="text-sm font-bold tracking-tight text-white uppercase font-mono tracking-widest">OpenFAM</h1>
            </div>
            <p className="text-[10px] text-white/20 font-mono tracking-[0.2em] uppercase">Built for security & performance &copy; 2026</p>
          </div>
          
          <div className="flex gap-12">
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Resources</span>
              <a href="https://github.com/fabienfleureau/openfam" className="text-xs text-white/40 hover:text-white transition-colors">Documentation</a>
              <a href="https://github.com/fabienfleureau/openfam" className="text-xs text-white/40 hover:text-white transition-colors">Architecture</a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Connect</span>
              <a href="https://github.com/fabienfleureau/openfam" className="text-xs text-white/40 hover:text-white transition-colors">GitHub</a>
              <a href="https://github.com/fabienfleureau/openfam" className="text-xs text-white/40 hover:text-white transition-colors">Discussions</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
