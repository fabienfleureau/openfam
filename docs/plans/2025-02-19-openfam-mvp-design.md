# Open-F.A.M. MVP Design

**Date:** 2025-02-19
**Status:** Approved
**Scope:** CLI + Router Agent with NextDNS Integration

## Overview

Open-F.A.M. ("The smart heart of your family's network") is a parental control system. This MVP focuses on **CLI management** and **router agent** that automatically applies NextDNS profiles based on time-based schedules per device.

**Removed from original scope:** Web dashboard (deferred to future; config file will be replaced by API later)

## Architecture

```
┌─────────────────┐         SSH          ┌─────────────────┐
│   CLI (local)   │◄────────────────────►│  OpenWrt Router │
│                 │                      │                 │
│ - Install       │                      │ - config.toml   │
│ - Configure     │                      │ - Agent         │
│ - Monitor       │                      │ - NextDNS CLI   │
└─────────────────┘                      └─────────────────┘
```

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **CLI** | User's computer | SSH to router, manage config, view logs |
| **Agent** | `/etc/fam/` on router | Poll config, apply NextDNS changes |
| **Config** | `/etc/fam/config.toml` | Single source of truth (TOML) |
| **NextDNS CLI** | Router (via opkg) | Per-device DNS profile management |

## Config File Structure

```toml
# /etc/fam/config.toml

[general]
timezone = "Europe/Paris"
nextdns_default_profile = "default"

# NextDNS profile definitions
[nextdns.profiles.homework]
id = "abc123"
name = "Homework Mode"
link = "https://my.nextdns.io/profile/abc123"

[nextdns.profiles.freetime]
id = "def456"
name = "Free Time"
link = "https://my.nextdns.io/profile/def456"

[nextdns.profiles.restricted]
id = "ghi789"
name = "Restricted"
link = "https://my.nextdns.io/profile/ghi789"

# User profiles
[[profiles]]
name = "Emma"
default_nextdns = "freetime"

[[profiles.macs]]
address = "AA:BB:CC:DD:EE:FF"
name = "Emma's iPhone"

[[profiles.schedule]]
days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
time_start = "16:00"
time_end = "18:00"
nextdns = "homework"

[[profiles.schedule]]
days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
time_start = "21:00"
time_end = "07:00"
nextdns = "restricted"
```

## CLI Commands

```bash
# Installation
openfam install                # Full setup on router
openfam install --check        # Verify connectivity first

# Profile management
openfam profiles list
openfam profiles add <name>
openfam profiles remove <id>
openfam profiles show <id>

# Device management
openfam devices scan           # Scan router DHCP/ARP
openfam devices add <profile-id> <mac> [--name "desc"]
openfam devices remove <mac>
openfam devices list

# NextDNS management
openfam nextdns list           # Shows profile IDs + dashboard links
openfam nextdns add <id> <name>
openfam nextdns remove <id>

# Schedule management
openfam schedule add <profile-id>    # Interactive builder
openfam schedule remove <profile-id> <index>
openfam schedule show <profile-id>   # Visual weekly view

# Logs & status
openfam logs [--tail]
openfam status
```

## Agent Architecture

```
/etc/fam/
├── config.toml           # Main config (CLI-managed)
├── agent.sh              # Main orchestrator (cron entry)
├── lib/
│   ├── config.sh         # TOML parsing
│   ├── schedule.sh       # Time matching logic
│   ├── nextdns.sh        # NextDNS CLI wrapper
│   └── log.sh            # Logging utilities
├── last-command.txt      # Last executed command (for diff)
└── logs/
    └── fam.log           # Activity log
```

### Agent Flow (Every 5 Minutes)

1. Load `config.toml`
2. Get current time (router's timezone)
3. Determine active NextDNS profile for each MAC
4. Build `nextdns config` command with `--device` args (sorted by MAC)
5. Compare with `last-command.txt`
6. If different: execute NextDNS command, update `last-command.txt`, log changes
7. If same: log "no changes, skipping"

### NextDNS Integration

Single command with all devices:
```bash
nextdns config --device 11:22:33:44:55:66=abc123 --device AA:BB:CC:DD:EE:FF=def456
```

## Error Handling

| Scenario | Response |
|----------|----------|
| SSH timeout | Clear error, suggest network check |
| Schedule gap (uncovered time) | Error: "Schedule must cover full week" |
| Unknown NextDNS profile ID | Error: "Profile not defined" |
| Invalid MAC format | Error: "Must match XX:XX:XX:XX:XX:XX" |
| NextDNS CLI missing | Log error, attempt reinstall |
| Config file corrupted | Keep last-known-good state |

## First-Run Experience

1. Check router connectivity (ping + SSH)
2. Install dependencies: `opkg install nextdns jq`
3. Create `/etc/fam/config.toml` with defaults
4. Install agent files to `/etc/fam/`
5. Set up cron: `*/5 * * * * /etc/fam/agent.sh`
6. Prompt for NextDNS profile ID
7. Optionally add first user profile
8. Start agent, show status

## Tech Stack

### CLI (`openfam-cli/`)
- TypeScript (ES2022 modules)
- Node.js >= 18
- `node-ssh` - SSH connection
- `@iarna/toml` - TOML parsing
- `commander` - CLI framework
- `inquirer` - Interactive prompts
- `chalk` - Colored output

### Agent (`fam-agent/`)
- POSIX-compliant Ash (busybox)
- Cron for scheduling
- NextDNS CLI (via opkg)

## Success Criteria

1. ✅ CLI can install agent on fresh OpenWrt router
2. ✅ Can create user profile with MACs from device scan
3. ✅ Schedule works - devices switch profiles based on time
4. ✅ `openfam logs` shows agent activity
5. ✅ Unknown MACs get default profile

## Out of Scope (Future)

- Web dashboard
- Authentication/authorization
- Captive portal
- App-level filtering (beyond DNS)
- Firewall rules
- Bonus time request system
