# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Open-F.A.M.** ("The smart heart of your family's network") is a parental control system built as three interconnected modules:

1. **Cloud Dashboard** (`web/`) - Next.js + Tailwind + Supabase frontend
2. **Router Agent** (`fam-agent`) - Ash script for OpenWrt routers
3. **Installer CLI** (`fam-cli`) - Python setup tool for parents' computers

The system implements zero-trust network access, profile-based filtering, time-based schedules, and a "bonus time" request system.

## Architecture

### Communication Pattern
All modules communicate via a **JSON-based state exchange**. The router polls the cloud API for configuration and applies it locally via plugin scripts.

### Router Plugin Architecture
The router agent (`/etc/fam/agent.sh`) orchestrates plugins in `/etc/fam/plugins/`:

```
/etc/fam/
├── config.json         # Local cache of cloud config
├── agent.sh            # Master loop orchestrator
├── plugins/
│   ├── dns.sh          # DNS management (UCI dnsmasq)
│   ├── firewall.sh     # NFTables rules per MAC
│   ├── appblock.sh     # OpenAppFilter (OAF) integration
│   └── portal.sh       # OpenNDS captive portal logic
└── fail_safe/
    └── reset.sh        # Emergency reset (panic button)
```

### JSON Schema (Router ↔ Cloud Contract)
```json
{
  "router_id": "FAM-9923",
  "global_settings": { "dns_provider": "nextdns", "quarantine_new": true },
  "profiles": [
    {
      "id": "child_01",
      "macs": ["AA:BB:CC:DD:EE:FF"],
      "schedule": [
        { "time": "16:00-18:00", "mode": "homework", "apps": ["tiktok:block", "roblox:block"] },
        { "time": "21:00-07:00", "mode": "sleep", "internet": "off" }
      ]
    }
  ]
}
```

## Dashboard (`web/`)

### Tech Stack
- **Framework**: Next.js with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with CSS variables for theming
- **Database**: Supabase (PostgreSQL)

### Theme System
Three visual themes must be switchable via data attribute/class toggle:

| Theme | Aesthetic | Colors | Typography |
|-------|-----------|--------|------------|
| **Signal Atlas** | Crisp, technical | Deep teal, slate, warm parchment, amber | Serif headings + sans UI |
| **Playground Control** | Friendly, pro | Sand, coral, forest green, charcoal | Rounded grotesk + mono accents |
| **Nightshift Utilities** | Industrial, rugged | Off-white, black, safety orange | Condensed display + utilitarian sans |

### Pages
- Router Health
- Profiles
- Devices
- DNS
- Captive Portal
- Settings

### Web Development Commands
```bash
cd web/
npm install              # Install dependencies
npm run dev             # Start dev server (http://localhost:3000)
npm run build           # Production build
npm run lint            # ESLint
npm run type-check      # TypeScript validation
```

## Router Agent (OpenWrt)

### Language & Tools
- **Shell**: POSIX-compliant Ash (busybox)
- **JSON**: `jq` for parsing
- **Config**: UCI (Unified Configuration Interface)
- **Firewall**: NFTables
- **Captive Portal**: OpenNDS
- **App Filtering**: OpenAppFilter (OAF)

### Key Patterns
- **UCI Operations**: Use `uci show/set/get/delete` for all config changes
- **JSON Parsing**: All config exchange via `jq`
- **Idempotency**: Plugins must handle repeated execution safely
- **Error Handling**: Always check exit codes, log to `/tmp/fam.log`

### Router Testing
```bash
# SSH to router
ssh root@192.168.1.1

# Test plugin manually
/etc/fam/plugins/dns.sh

# View logs
tail -f /tmp/fam.log

# Test JSON parsing
echo '{"profiles":[]}' | jq '.'
```

## Installer CLI (`fam-cli`)

### Tech Stack
- **Language**: Python
- **SSH Library**: `paramiko`
- **Functions**: Backup config, flash OpenWrt images, bootstrap router

### CLI Development Commands
```bash
cd fam-cli/
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m fam_cli --help
```

## Security Fail-Safe

The physical reset button (`/etc/rc.button/reset`) MUST:
1. Kill `fam-agent` process
2. Restore UCI config from `/etc/fam/backup/config/`
3. Flush NFTables: `nft flush ruleset`
4. Reboot to clean state

**Never modify the fail-safe behavior** — it's the parent's emergency escape.

## Implementation Phases

1. **Phase 1**: CLI + Bootstrap (Python installer, OpenWrt bootstrap script)
2. **Phase 2**: Router Agent + Device Detection (MAC detection, JSON polling)
3. **Phase 3**: Captive Portal + Webhooks (OpenNDS, approval requests)
4. **Phase 4**: Granular Filtering (OAF integration, NextDNS switching)

## Key Conventions

- **No Authentication**: Initial dashboard has no login system
- **Zero-Trust Default**: New devices are quarantined until approved
- **State Polling**: Router pulls config (no push from cloud)
- **Plugin Isolation**: Each plugin in `/etc/fam/plugins/` is independently executable
- **UCI Commit Pattern**: Always `uci commit && <service reload>` after changes

## Task Management with VibeKanban

When starting implementation work, **always use VibeKanban** for task tracking and workspace sessions.

### Workflow
1. **Propose VibeKanban** for any new substantive task (not single-line fixes)
2. **Create task** in the **openfam** project
3. **Start workspace session** with:
   - Executor: `CLAUDE_CODE`
   - Variant: `ZAI`
4. Work directly in the spawned workspace session

### Example Flow
```
User: "Implement the DNS plugin"
Claude: "I'll create a VibeKanban task and start a workspace session for this.
        [Creates task → Starts session with CLAUDE_CODE/ZAI]"
```

### When to Skip VibeKanban
- Single-line fixes or typos
- Documentation updates
- Quick configuration changes
