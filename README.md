# OpenFAM

> "The smart heart of your family's network"

A modern parental control system built for OpenWrt routers. Zero-trust network access, profile-based filtering, time-based schedules, and a family-friendly approval workflow.

## Overview

OpenFAM helps parents manage their family's network through:

- **Zero-Trust Access** - New devices are quarantined until approved
- **Profile-Based Rules** - Different settings for each family member
- **Time Scheduling** - Homework time, bedtime, screen-free periods
- **App Filtering** - Block specific apps and categories (via DNS & OAF)
- **Bonus Time** - Kids can request extra time with parental approval
- **Smart Device Inventory** - Unified view of all network devices with "Last Seen" tracking

## Architecture

```
┌─────────────────┐     JSON State    ┌──────────────────┐
│  Web Dashboard  │◄──────────────────►│  OpenWrt Router  │
│  (Next.js)      │   (/etc/openfam)   │  (openfam-agent) │
└─────────────────┘                    └──────────────────┘
        ▲                                      │
        │                               Plugins:
┌─────────────────┐                     ├─ DNS (NextDNS)
│  Installer CLI  │                     ├─ Firewall (NFTables)
│  (TypeScript)   │                     └─ App Block (OAF)
└─────────────────┘
```

## Components

| Component | Tech Stack | Status |
|-----------|------------|--------|
| **Installer CLI** | TypeScript + Node.js (Bundled) | ✅ Functional |
| **Router Agent** | POSIX Ash + jq | ✅ Functional |
| **Web Dashboard** | Next.js + Tailwind + Supabase | 🛠️ In Progress |

## Quick Start

### Prerequisites

- OpenWrt router with SSH access
- Node.js >= 18 (for CLI development)
- SSH key pair for authentication

### 1. Install the CLI

```bash
git clone https://github.com/yourusername/openfam.git
cd openfam/openfam-cli
npm install
npm run build:binary
```

The CLI is bundled with all router agent scripts, making it a single standalone binary.

### 2. Configure

Create a `.env` file in `openfam-cli/` with your router details:

```env
OPENWRT_ROUTER_IP=192.168.1.1
OPENWRT_SSH_KEY_PATH=~/.ssh/id_ed25519
```

### 3. Install on Router

This will install the agent, `jq`, `nextdns`, and set up the cron jobs.

```bash
./dist/openfam install
```

### 4. Manage Your Network

```bash
# View all devices (connected & configured)
./dist/openfam devices

# Manage profiles
./dist/openfam profiles add "Emma"
./dist/openfam devices add Emma AA:BB:CC:DD:EE:FF --name "Emma's Tablet"

# Manage schedules
./dist/openfam schedule add Emma
```

## CLI Commands

```bash
openfam install          # Full setup on router
openfam devices          # Unified device inventory with last seen
openfam profiles list    # Manage family profiles
openfam schedule show    # View time-based rules
openfam nextdns list     # Manage NextDNS profiles
openfam status           # Check agent health & file integrity
openfam logs             # View real-time agent logs
```

## Security

- **SSH Key Authentication Only** - No password authentication allowed.
- **Bundled Assets** - Agent scripts are embedded in the CLI binary for security and portability.
- **JSON Single Source of Truth** - State is managed via `/etc/openfam/config.json`.
- **Physical Fail-Safe** - Reset button restores original router configuration.

See [CLAUDE.md](./CLAUDE.md) for detailed development and security guidelines.

## Development

### CLI

```bash
cd openfam-cli/
npm run build           # Compile TypeScript
npm run build:binary    # Create standalone binary
npm run dev             # Watch mode
```

### Web Dashboard (MVP V2)

```bash
cd web/
npm install
npm run dev             # http://localhost:3000
```

## Roadmap

- [x] JSON-based State Management
- [x] Efficient POSIX Agent with jq
- [x] Bundled CLI Binary
- [x] Smart Device Inventory
- [ ] TUI (Terminal UI) Dashboard Mode
- [ ] Web Dashboard with Magic Link Auth
- [ ] Bonus Time Request System

## License

MIT
