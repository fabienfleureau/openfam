# Open-F.A.M.

> "The smart heart of your family's network"

A modern parental control system built for OpenWrt routers. Zero-trust network access, profile-based filtering, time-based schedules, and a family-friendly approval workflow.

## Overview

Open-F.A.M. helps parents manage their family's network through:

- **Zero-Trust Access** - New devices are quarantined until approved
- **Profile-Based Rules** - Different settings for each family member
- **Time Scheduling** - Homework time, bedtime, screen-free periods
- **App Filtering** - Block specific apps and categories
- **Bonus Time** - Kids can request extra time with parental approval
- **Captive Portal** - Friendly web interface for approvals

## Architecture

```
┌─────────────────┐     JSON API      ┌──────────────────┐
│  Web Dashboard  │◄──────────────────►│  OpenWrt Router  │
│  (Next.js)      │                    │  (fam-agent)     │
└─────────────────┘                    └──────────────────┘
                                               │
                                        Plugins:
                                        ├─ DNS (NextDNS)
                                        ├─ Firewall (NFTables)
                                        ├─ App Block (OAF)
                                        └─ Portal (OpenNDS)
```

## Components

| Component | Tech Stack | Status |
|-----------|------------|--------|
| **Web Dashboard** | Next.js + Tailwind + Supabase | In Progress |
| **Installer CLI** | TypeScript + Node.js | ✅ Functional |
| **Router Agent** | Ash (busybox) + jq | To Do |

## Quick Start

### Prerequisites

- OpenWrt router with SSH access
- Node.js >= 18
- SSH key pair for authentication

### 1. Install the CLI

```bash
git clone https://github.com/yourusername/openfam.git
cd openfam/openfam-cli
npm install
npm run build
```

### 2. Configure

Create a `.env` file with your router details:

```env
OPENWRT_ROUTER_IP=192.168.10.1
OPENWRT_SSH_KEY_PATH=~/.ssh/id_ed25519
```

### 3. Test Connection

```bash
node dist/cli.js auth check
```

### 4. View Connected Devices

```bash
node dist/cli.js devices list
```

Output:
```
──────────────────────────────────────────────────────────────────────
Connected (3)
──────────────────────────────────────────────────────────────────────
  ● 192.168.10.1    AA:BB:CC:DD:EE:01  router           br-lan
  ● 192.168.10.137  AA:BB:CC:DD:EE:AB  Nokia-3310       br-lan
  ● 192.168.10.184  AA:BB:CC:DD:EE:2D  laptop           br-lan

──────────────────────────────────────────────────────────────────────
Offline (2)
──────────────────────────────────────────────────────────────────────
  ○ 192.168.10.45   AA:BB:CC:DD:EE:05  tablet           br-lan
  ○ 192.168.10.89   AA:BB:CC:DD:EE:09  phone-wifi       br-lan
──────────────────────────────────────────────────────────────────────
Total: 5 devices  |  3 connected  |  2 offline
```

## CLI Commands

```bash
# Authentication
openfam auth check           # Test SSH connectivity

# Device Management
openfam devices list         # List all devices
openfam devices list --json  # JSON output

# Options
--debug, -d                  # Enable verbose output
--help, -h                   # Show help
```

## Security

- **SSH Key Authentication Only** - No password authentication
- **Strict Host Key Verification** - Prevents MITM attacks
- **Zero-Trust Default** - New devices quarantined automatically
- **Physical Fail-Safe** - Reset button restores network access

See [CLAUDE.md](./CLAUDE.md) for security guidelines.

## Development

### Web Dashboard

```bash
cd web/
npm install
npm run dev          # http://localhost:3000
npm run build
npm run lint
```

### CLI

```bash
cd openfam-cli/
npm run build        # Compile TypeScript
npm run dev          # Watch mode
npm run type-check   # Validate
```

## Roadmap

- [ ] Router agent implementation
- [ ] DNS plugin (NextDNS integration)
- [ ] Firewall plugin (NFTables per-MAC rules)
- [ ] Captive portal integration
- [ ] Web dashboard profiles management
- [ ] App filtering (OAF integration)

## License

MIT

## Contributing

Contributions welcome! Please read [CLAUDE.md](./CLAUDE.md) for development guidelines.
