# OpenFAM

> "The smart heart of your family's network"

A modern parental control system built for OpenWrt routers. Zero-trust network access, profile-based filtering, time-based schedules, and a family-friendly approval workflow.

## Overview

OpenFAM helps parents manage their family's network through:

- **Zero-Trust Access** - New devices are quarantined until approved
- **Profile-Based Rules** - Different settings for each family member (Leo, Maya, etc.)
- **Time Scheduling** - Homework time, bedtime, screen-free periods
- **App Filtering** - Block specific apps and categories (via DNS & OAF)
- **Bonus Time** - Kids can request extra time with parental approval
- **Smart Device Inventory** - Unified view of all network devices with real-time "Last Seen" tracking

## Why OpenFAM?

Unlike standard ISP routers or phone-based apps, OpenFAM operates at the **source**:
- **Un-bypassable**: Cannot be uninstalled or "force stopped" by kids.
- **Whole-Home Coverage**: Protects consoles, Smart TVs, and IoT devices automatically.
- **Privacy First**: Your data stays on your hardware. No third-party trackers.

## Architecture

```
┌─────────────────┐     JSON State    ┌────────────────────┐
│  Web Dashboard  │◄──────────────────►│   OpenWrt Router   │
│  (Next.js 15)   │   (/etc/openfam)   │  (openfam-agent)   │
└─────────────────┘                    └────────────────────┘
        ▲                                        │
        │                                 Plugins:
┌─────────────────┐                       ├─ DNS (NextDNS)
│  Standalone CLI │                       ├─ Firewall (NFTables)
│  (TypeScript)   │                       └─ App Block (OAF)
└─────────────────┘
```

## Components

| Component | Directory | Tech Stack | Status |
|-----------|-----------|------------|--------|
| **Installer CLI** | `openfam-cli/` | TypeScript + Node.js (Bundled) | ✅ Functional |
| **Router Agent** | `openfam-agent/` | POSIX Ash + jq | ✅ Functional |
| **Web Dashboard** | `web/` | Next.js 15 + Tailwind (Obsidian Pulse) | 🛠️ In Progress |

## Quick Start

### Prerequisites

- OpenWrt router with SSH access
- Node.js >= 18 (for CLI development)
- SSH key pair for authentication

### 1. Build the CLI

```bash
git clone https://github.com/fabienfleureau/openfam.git
cd openfam/openfam-cli
npm install
npm run build:binary
```

### 2. Configure

Create a `.env` file in `openfam-cli/` with your router details:

```env
OPENWRT_ROUTER_IP=192.168.1.1
OPENWRT_SSH_KEY_PATH=~/.ssh/id_ed25519
```

### 3. Install on Router

This will install the agent, `jq`, `nextdns`, and set up the automated polling.

```bash
./dist/openfam install
```

### 4. Manage Your Network

```bash
# View unified device inventory
./dist/openfam devices

# Manage profiles & schedules
./dist/openfam profiles add "Leo"
./dist/openfam schedule add Leo
```

## Security

- **SSH Key Authentication** - No password authentication allowed.
- **Bundled Assets** - Agent scripts are embedded in the binary for integrity.
- **Zero-Trust Default** - New devices quarantined until assigned to a profile.
- **Physical Fail-Safe** - Reset button restores original router configuration.

## Roadmap

- [x] JSON-based State Management
- [x] Standalone Bundled CLI Binary
- [x] Unified Device Inventory with Last Seen
- [x] Obsidian Pulse Dashboard Design
- [ ] TUI (Terminal UI) Dashboard Mode
- [ ] Supabase Magic Link Auth Integration
- [ ] Bonus Time Request System

## License

MIT
