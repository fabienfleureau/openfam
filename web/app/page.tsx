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
  ArrowUpRight,
  EyeOff,
  UserPlus,
  ArrowRightLeft,
  MousePointer2
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
          Exclusively for OpenWrt Routers
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-8xl font-bold tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 leading-[0.9]"
        >
          Un-bypassable protection <br /> for the whole family.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-white/40 max-w-2xl mb-12 leading-relaxed px-4"
        >
          Don&apos;t just install apps on phones. Secure the router. <br />
          OpenFAM brings un-bypassable parental controls and ad-blocking to your OpenWrt home network.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4 px-4"
        >
          <Link href="/signup" className="btn-primary flex items-center gap-2 px-8 py-4 text-base">
            Protect My Family <ChevronRight size={20} />
          </Link>
          <a 
            href="https://github.com/fabienfleureau/openfam" 
            target="_blank" 
            rel="noreferrer"
            className="btn-secondary flex items-center gap-2 px-8 py-4 text-base group"
          >
            <Github size={20} /> 
            View Source
            <ArrowUpRight size={16} className="text-white/20 group-hover:text-white transition-colors" />
          </a>
        </motion.div>
      </section>

      {/* Why Router Level Matters */}
      <section className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">Why router-level <br /> control is superior.</h2>
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-xl bg-mint/10 flex-shrink-0 flex items-center justify-center text-mint">
                <Shield size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Un-bypassable Protection</h4>
                <p className="text-sm text-white/40">Unlike phone apps, kids cannot uninstall or &quot;force stop&quot; the router. If they are on the Wi-Fi, they are protected. Period.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-xl bg-safety/10 flex-shrink-0 flex items-center justify-center text-safety">
                <Users size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Every Device Covered</h4>
                <p className="text-sm text-white/40">Consoles, Smart TVs, and IoT devices that can&apos;t run apps are automatically filtered through your NextDNS profiles.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-xl bg-critical/10 flex-shrink-0 flex items-center justify-center text-critical">
                <EyeOff size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Privacy Focused</h4>
                <p className="text-sm text-white/40">No third-party trackers or data collection. Your network state stays on your router, synchronized only with your private dashboard.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="glass-card p-1 bg-gradient-to-br from-white/10 to-transparent">
          <div className="bg-background rounded-[15px] p-8">
            <h4 className="text-xs font-mono text-white/20 uppercase tracking-widest mb-8 text-center">OpenFAM vs. Standard ISP Routers</h4>
            <div className="space-y-4">
              {[
                { label: 'Un-bypassable', isp: false, fam: true },
                { label: 'Per-Device Scheduling', isp: 'Limited', fam: true },
                { label: 'NextDNS / Ad-Blocking', isp: false, fam: true },
                { label: 'Zero-Trust Quarantine', isp: false, fam: true },
                { label: 'Privacy & Open Source', isp: false, fam: true },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                  <span className="text-sm text-white/60">{row.label}</span>
                  <div className="flex gap-8">
                    <span className="w-16 text-center text-xs text-white/20">{row.isp === true ? '✓' : (row.isp === false ? '✗' : row.isp)}</span>
                    <span className="w-16 text-center text-xs text-mint font-bold">✓</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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
                    <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Leo&apos;s Active Schedule</span>
                  </div>
                  <h3 className="text-3xl font-bold tracking-tight">Homework Mode</h3>
                  <p className="text-white/40 text-sm mt-1">NextDNS: <span className="text-mint">Strict-Education</span> • Ends at 18:00</p>
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
                <h4 className="text-xs font-mono text-white/30 uppercase tracking-[0.2em] mb-6">Device Associations</h4>
                <div className="space-y-4">
                  {[
                    { name: 'Leo', devices: 3, mode: 'Homework', color: 'text-mint' },
                    { name: 'Maya', devices: 2, mode: 'Freetime', color: 'text-white' },
                    { name: 'Parents', devices: 5, mode: 'Ad-Block Only', color: 'text-white/40' }
                  ].map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group/item">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover/item:text-white transition-colors">
                          <Users size={18} />
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{p.name}</div>
                          <div className={`text-[10px] ${p.color}`}>
                            {p.devices} devices • {p.mode}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Quarantine Alert */}
            <motion.div className="glass-card p-6 border-critical/30 bg-critical/5">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="text-critical" size={16} />
                <span className="text-[10px] font-mono text-critical uppercase tracking-widest">Quarantine Alert</span>
              </div>
              <h4 className="text-lg font-bold mb-1">New Unknown Device</h4>
              <p className="text-xs text-white/40 mb-4">MAC: 94:58:CB:B0:1D:F0 <br /> Access restricted until assigned.</p>
              <button className="w-full py-2 bg-critical/20 hover:bg-critical/30 border border-critical/20 rounded-lg text-[10px] font-bold uppercase tracking-widest text-critical transition-all">Assign to Profile</button>
            </motion.div>

            {/* Bonus Time Request */}
            <motion.div className="glass-card p-6 border-safety/30">
              <div className="flex items-center gap-2 mb-4 text-safety">
                <Timer size={16} />
                <span className="text-[10px] font-mono uppercase tracking-widest">Bonus Request</span>
              </div>
              <h4 className="text-lg font-bold mb-1">Leo needs more time</h4>
              <p className="text-xs text-white/40 mb-4">Leo requested <span className="text-white font-bold">+30m Freetime</span> <br /> Bedtime starts in 10 minutes.</p>
              <div className="flex gap-2">
                <button className="flex-1 py-2 bg-safety/20 hover:bg-safety/30 border border-safety/20 rounded-lg text-[10px] font-bold uppercase text-safety transition-all">Approve</button>
                <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold uppercase text-white/40 transition-all">Deny</button>
              </div>
            </motion.div>

            {/* NextDNS Stats */}
            <motion.div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4 text-mint">
                <Shield size={16} />
                <span className="text-[10px] font-mono uppercase tracking-widest">NextDNS Security</span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-3xl font-bold font-mono tracking-tighter">1,452</div>
                  <div className="text-[10px] text-white/40 uppercase">Ads & Trackers Blocked Today</div>
                </div>
                <div className="h-12 w-12 rounded-full border-2 border-mint/20 border-t-mint animate-spin" style={{ animationDuration: '3s' }} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Three Main Scenarios */}
      <section className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold tracking-tight mb-4 text-gradient">Safety, Clarity, Balance.</h2>
          <p className="text-white/40 max-w-xl mx-auto">Three ways OpenFAM transforms your family&apos;s digital life.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-mint/10 border border-mint/20 flex items-center justify-center text-mint">
              <Shield size={24} />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white">Protect your Child</h3>
            <p className="text-sm text-white/40 leading-relaxed">
              Enforce strict filtering for younger family members. Block adult content, gambling, and malicious sites automatically via NextDNS integration.
            </p>
          </div>

          <div className="space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-safety/10 border border-safety/20 flex items-center justify-center text-safety">
              <Activity size={24} />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white">Ad-Free Family</h3>
            <p className="text-sm text-white/40 leading-relaxed">
              Improve the web experience for everyone. Block annoying trackers and intrusive ads at the network level, speeding up the web for every device.
            </p>
          </div>

          <div className="space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-critical/10 border border-critical/20 flex items-center justify-center text-critical">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white">Improve Time Balance</h3>
            <p className="text-sm text-white/40 leading-relaxed">
              Define healthy boundaries. Automatically switch to &quot;Homework Mode&quot; (Educational sites only) or &quot;Bedtime&quot; (100% Block) without lifting a finger.
            </p>
          </div>
        </div>
      </section>

      {/* Easy Installation Narrative */}
      <section className="bg-obsidian-surface border-y border-obsidian-border py-24 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-16">Zero-Stress Setup.</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent -z-10" />
            
            <div className="space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-background border border-white/10 flex items-center justify-center font-mono text-sm text-mint">01</div>
              <h4 className="font-bold text-white">Run Command</h4>
              <p className="text-xs text-white/40">Run the standalone OpenFAM binary on your computer. It handles the router connection automatically.</p>
            </div>

            <div className="space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-background border border-white/10 flex items-center justify-center font-mono text-sm text-mint">02</div>
              <h4 className="font-bold text-white">Auto-Install</h4>
              <p className="text-xs text-white/40">The binary installs the lightweight agent and configuration engine directly onto your OpenWrt router.</p>
            </div>

            <div className="space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-background border border-white/10 flex items-center justify-center font-mono text-sm text-mint">03</div>
              <h4 className="font-bold text-white">Go Visual</h4>
              <p className="text-xs text-white/40">Open your browser. Your family dashboard is ready to go. No SSH terminal or scripting required.</p>
            </div>
          </div>

          <div className="mt-16 inline-flex flex-col items-center">
            <div className="p-4 rounded-xl bg-black border border-white/10 font-mono text-sm text-white/80 flex items-center gap-4">
              <span className="text-mint">$</span>
              <span>./openfam install</span>
              <button className="ml-4 p-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors">
                <MousePointer2 size={14} className="text-white/40" />
              </button>
            </div>
            <p className="mt-4 text-[10px] text-white/20 uppercase tracking-widest font-mono">One binary. One command. All the power.</p>
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
              Built by parents, for parents. Audit the code, contribute features, or deploy your own instances without limits.
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
