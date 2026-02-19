# CLAUDE.md

This repository is public hosted on github. Every commit must be 100% secure.

## Security: No Secrets in Commits

**Strict Rule:** Never commit the following to this repository:
- Passwords or API keys
- Private tokens or credentials
- Environment variable values (`.env` file contents)
- Database connection strings
- SSH private keys
- Any sensitive configuration data

**Required Actions:**
- Review all diffs with `git diff` before committing
- Ensure no secrets in `git status --porcelain` untracked files
- Use `.gitignore` to prevent accidental commits of sensitive files
- If secrets are accidentally committed, immediately remove them with `git revert` or `git reset`

**Enforcement:**
This rule applies to all users, all commits, and all branches. Security is everyone's responsibility.

---

## Project Overview

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Open-F.A.M.** ("The smart heart of your family's network") is a parental control system. This MVP focuses on **CLI management** and **router agent** that automatically applies NextDNS profiles based on time-based schedules per device.

### Architecture

**CLI (`openfam-cli/`)** - Runs on your computer, communicates via SSH to manage config
**Agent (`fam-agent/`)** - Lives on OpenWrt router, polls config every 5 minutes
**Config** - `/etc/fam/config.toml` single source of truth

### Commands

```bash
openfam install [--check]      # Install agent on router
openfam profiles list           # List user profiles
openfam devices scan            # Scan for connected devices
openfam schedule add <id>       # Add time-based schedule
openfam status                  # Check agent status
openfam logs                    # View agent logs
```

## Architecture

### Communication Pattern
All modules communicate via a **TOML-based config**. The router agent polls the local config file every 5 minutes and applies NextDNS profiles accordingly.

### Router Agent Architecture
The router agent (`/etc/fam/agent.sh`) polls config and applies NextDNS settings:

```
/etc/fam/
├── config.toml         # TOML configuration (single source of truth)
├── agent.sh            # Main orchestrator (runs every 5 min via cron)
├── lib/
│   ├── log.sh          # Logging utilities
│   ├── config.sh       # Config parsing helpers
│   ├── schedule.sh     # Time/day utilities
│   └── nextdns.sh      # NextDNS command builder
├── logs/
│   └── fam.log         # Agent logs
└── last-command.txt    # Last executed NextDNS command
```

### TOML Config Schema
```toml
[general]
timezone = "UTC"
nextdns_default_profile = "default"

[nextdns.profiles.default]
id = "abc123"
name = "Default Profile"
link = "https://my.nextdns.io/profile/abc123"

[[profiles]]
name = "Emma"
default_nextdns = "default"

[[profiles.macs]]
address = "AA:BB:CC:DD:EE:FF"
name = "Emma's Phone"

[[profiles.schedule]]
days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
time_start = "21:00"
time_end = "07:00"
nextdns = "restricted"
```

## Installer CLI (`openfam-cli/`)

### Tech Stack
- **Language**: TypeScript (ES2022 modules)
- **Runtime**: Node.js >= 18
- **SSH**: node-ssh library with strict host key verification
- **Authentication**: SSH keys only (no password auth for security)

### Commands
```bash
cd openfam-cli/
npm install && npm run build

# Check router connectivity
node dist/cli.js install --check

# Full installation on router
node dist/cli.js install

# Manage profiles
node dist/cli.js profiles list
node dist/cli.js profiles add "Emma"
node dist/cli.js profiles show 1

# Manage devices
node dist/cli.js devices scan
node dist/cli.js devices list
node dist/cli.js devices add 1 AA:BB:CC:DD:EE:FF --name "Phone"

# Manage schedules
node dist/cli.js schedule add 1
node dist/cli.js schedule show 1

# Manage NextDNS profiles
node dist/cli.js nextdns list
node dist/cli.js nextdns add abc123 "Restricted"

# Status and logs
node dist/cli.js status
node dist/cli.js logs
node dist/cli.js logs --tail

# Or link globally
npm link
openfam --help
```

### Configuration
Create `.env` in the `openfam-cli/` directory:

```env
OPENWRT_ROUTER_IP=192.168.10.1
OPENWRT_SSH_KEY_PATH=~/.ssh/id_ed25519
```

### Security Notes
- SSH key authentication **required** (no passwords)
- Strict host key verification enabled
- Debug mode warns about potential sensitive info exposure
- Always validate SSH key permissions (0600 recommended)

### CLI Development Commands
```bash
cd openfam-cli/
npm run build           # Compile TypeScript
npm run dev             # Watch mode
npm run type-check      # TypeScript validation
npm run lint            # ESLint
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
- **Config**: TOML format (simpler than JSON for shell parsing)
- **DNS**: NextDNS CLI (`/usr/sbin/nextdns`)
- **Scheduling**: Cron runs agent every 5 minutes

### Key Patterns
- **TOML Parsing**: Simple awk/grep parsing for Ash shell compatibility
- **Idempotency**: Agent tracks last executed command, only runs on change
- **Error Handling**: All functions log to `/etc/fam/logs/fam.log`
- **Lock File**: Prevents concurrent execution

### Router Testing
```bash
# SSH to router
ssh root@192.168.1.1

# Test agent manually
/etc/fam/agent.sh

# View logs
tail -f /etc/fam/logs/fam.log

# Check last command
cat /etc/fam/last-command.txt

# View config
cat /etc/fam/config.toml
```

## Security Fail-Safe

The physical reset button (`/etc/rc.button/reset`) MUST:
1. Kill `fam-agent` process
2. Restore UCI config from `/etc/fam/backup/config/`
3. Flush NFTables: `nft flush ruleset`
4. Reboot to clean state

**Never modify the fail-safe behavior** — it's the parent's emergency escape.

## Implementation Phases

1. **Phase 1 (MVP - Complete)**: CLI + Router Agent with TOML config + NextDNS integration
2. **Phase 2 (Future)**: Time-based scheduling with day/time profiles
3. **Phase 3 (Future)**: Cloud Dashboard (Next.js + Supabase)
4. **Phase 4 (Future)**: Captive Portal + Webhooks (OpenNDS, approval requests)
5. **Phase 5 (Future)**: Granular Filtering (OAF integration, app-level blocking)

## Key Conventions

- **No Authentication**: Initial dashboard has no login system
- **Zero-Trust Default**: New devices are quarantined until approved
- **State Polling**: Router pulls config (no push from cloud)
- **Plugin Isolation**: Each plugin in `/etc/fam/plugins/` is independently executable
- **UCI Commit Pattern**: Always `uci commit && <service reload>` after changes
- **SSH Key Auth Only**: CLI uses SSH keys, never passwords

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

### Testing & Validation
For every task, **always run local preview and validate** before marking complete:

#### Web (`web/`)
```bash
cd web/
npm run dev              # Start dev server on http://localhost:3000
npm run lint            # Check linting
npm run type-check      # Validate TypeScript
```

#### CLI (`openfam-cli/`)
```bash
cd openfam-cli/
npm run build           # Build TypeScript
npm run type-check      # Validate TypeScript
node dist/cli.js auth check  # Test connectivity
```

#### Before Task Completion
1. **Run dev server** and verify changes visually
2. **Test all themes** (Signal Atlas, Playground Control, Nightshift Utilities)
3. **Check console** for errors
4. **Run linting** and fix any issues
5. **Responsive test** on mobile viewport

#### Automated Validation
When available:
```bash
npm test                # Run test suite
npm run test:coverage   # Check coverage
```
