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

---

## Project Overview

**OpenFAM** ("The smart heart of your family's network") is a parental control system.

### Architecture

**CLI (`openfam-cli/`)** - TypeScript-based management tool with both Command Line and TUI (Text User Interface) modes.
**Agent (`fam-agent/`)** - POSIX shell scripts on OpenWrt, polling JSON state every 5 minutes.
**Config** - `/etc/openfam/config.json` (The single source of truth on the router).

### Implementation Phases

1.  **Phase 1 (MVP V1):** CLI + Router Agent with **JSON config** + NextDNS integration.
2.  **Phase 2 (MVP V2):** Web Dashboard (Next.js + Supabase) with **Magic Link Authentication**.
3.  **Phase 3:** Captive Portal, Webhooks, and Granular DPI Filtering.

---

## Communication Pattern
All modules synchronize via a **JSON-based state** on the router. The agent uses `jq` to parse the configuration.

### JSON Config Schema (Draft)
```json
{
  "general": {
    "timezone": "UTC",
    "nextdns_default_profile": "default"
  },
  "nextdns": {
    "profiles": {
      "default": { "id": "abc123", "name": "Default Profile" }
    }
  },
  "profiles": [
    {
      "name": "Emma",
      "macs": [{ "address": "AA:BB:CC:DD:EE:FF", "name": "Emma's Phone" }],
      "schedule": [
        { "days": ["Mon", "Tue"], "time_start": "21:00", "time_end": "07:00", "nextdns": "restricted" }
      ]
    }
  ]
}
```

---

## Installer CLI (`openfam-cli/`)

### Tech Stack
- **Language**: TypeScript
- **SSH**: `node-ssh` (Strict host key verification required)
- **TUI**: `blessed` or `ink` (Planned for TUI mode)

### Command Modes
- **CLI Mode:** `openfam profiles list`
- **TUI Mode:** `openfam ui` (Interactive dashboard in terminal)

---

## Web Dashboard (`web/` - MVP V2)

### Tech Stack
- **Framework**: Next.js (App Router)
- **Database/Auth**: Supabase (PostgreSQL + Magic Link Auth)
- **UI**: Glassmorphism with Geometric Backgrounds

---

## Router Agent (OpenWrt)

### Key Tools
- **Shell**: POSIX-compliant Ash (busybox)
- **JSON Parsing**: `jq` (Required dependency)
- **Idempotency**: Agent tracks state and only applies changes if `config.json` has updated.

### Fail-Safe
The physical reset button (`/etc/rc.button/reset`) must flush all FAM-injected rules and restore original router configuration.

---

## Development Guidelines

1.  **State Polling:** The router pulls state; the cloud/CLI never "pushes" directly to services beyond updating the JSON file.
2.  **Zero-Trust:** New devices are restricted by default until assigned to a profile.
3.  **No Passwords:** SSH keys for CLI; Magic Links for Web.
