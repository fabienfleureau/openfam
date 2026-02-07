🛡️ Project: Open-F.A.M.

Tagline: The smart heart of your family's network.
1. System Architecture Overview

The system is divided into three distinct modules communicating via a JSON-based state exchange.

    Cloud Dashboard: Next.js / Tailwind / Supabase (PostgreSQL).

    Router Agent (fam-agent): Lightweight Ash script on OpenWrt using uci and jq.

    Installer CLI (fam-cli): Python-based setup tool for the parent's computer.

2. Feature Inventory
A. Zero-Trust Access (New Devices)

    Automatic Quarantine: New MAC addresses are assigned to a "Restricted" firewall zone immediately.

    Identification: Users are redirected to the Captive Portal to "Claim" their device (linking it to a profile).

    Approval Queue: Parent receives a push notification to approve/reject the new device.

B. Profile-Based Timetables

    Modes: * Homework: Only Whitelisted domains (educational) + DNS filtering.

        Free Time: Full access minus Adult/Malware content.

        Sleep: 100% block (all traffic dropped).

    Plugin Integration: * DNS: Switches between NextDNS profiles or AdGuard Home instances.

        DPI: Blocks apps (TikTok, Discord, YouTube) via OpenAppFilter (OAF).

C. The "Bonus Time" System

    Request Interface: When a child reaches their limit, the Captive Portal displays a "Request +30 mins" button.

    Webhook Trigger: Router sends a request to the API; Parent approves; API sends a temporary "State override" back to the router.

3. The "Plugin" Directory Structure (Router)

The router agent will execute scripts found in /etc/fam/plugins/.
Plaintext

/etc/fam/
├── config.json         # Local cache of the cloud config
├── agent.sh            # The orchestrator (Master Loop)
├── plugins/
│   ├── dns.sh          # Sets uci dhcp.@dnsmasq[0].server
│   ├── firewall.sh     # Manages nftables rules per MAC
│   ├── appblock.sh     # Manages OpenAppFilter (oaf) config
│   └── portal.sh       # Manages OpenNDS splash page logic
└── fail_safe/
    └── reset.sh        # The Panic Button script

4. Tasks & Implementation Roadmap
Phase 1: The "Bridge" & CLI (Installer)

    [ ] CLI Development: Create fam-cli in Python using paramiko for SSH.

        fam-cli backup: Pulls /etc/config and MTD partitions.

        fam-cli flash: Automates sysupgrade with an OpenWrt image.

    [ ] Bootstrap Script: A shell script that installs jq, oaf, opennds, and mosquitto-client on a fresh OpenWrt install.

Phase 2: Router Agent & New Device Detection

    [ ] Detection: Write /etc/fam/scripts/new_mac.sh triggered by dnsmasq lease events.

    [ ] State Pull: Implement a cron job that runs every minute to curl the JSON config from the web API.

    [ ] JSON Parser: Use jq in agent.sh to loop through the profiles and call relevant plugins.

Phase 3: The Captive Portal & Requests

    [ ] Portal Setup: Configure openNDS to serve a custom HTML page with a "Request Access" button.

    [ ] Webhooks: Implement the POST request from the router to the Cloud API when a child clicks a button.

Phase 4: Granular Filtering (DPI & DNS)

    [ ] OAF Plugin: Write the bridge to luci-app-oaf to enable/disable App Categories based on the JSON schedule.

    [ ] DNS Plugin: Integrate NextDNS by updating dnsmasq servers dynamically.

5. Security Fail-Safe (The Reset)

The "Reset Button" handler (/etc/rc.button/reset) must be implemented as follows:

    Stop fam-agent: Kill any running update loops.

    Restore UCI: cp -r /etc/fam/backup/config/* /etc/config/.

    Flush NFTables: nft flush ruleset.

    Reboot: Ensure the system comes back in a "Clean" state.

6. Sample JSON Schema (Contract between Web & Router)
JSON

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
