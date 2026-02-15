#!/bin/ash
# OpenFAM Router Agent - Main Orchestrator
# Idempotent, signal-safe, and ready for OpenWrt routers

set -e

# Paths
FAM_CONFIG="/etc/fam/config.json"
FAM_PLUGINS="/etc/fam/plugins"
FAM_STATE="/var/run/fam/state.json"
FAM_LOCK="/var/run/fam/agent.pid"

# Logging
FAM_LOG="/tmp/fam.log"

log() { echo "[$(date +%T)] $@" >> "$FAM_LOG"; }
log_err() { echo "[$(date +%T)] ERROR: $@" >&2; echo "$@" >> "$FAM_LOG"; }

# Ensure directories
ensure_dirs() {
    [ ! -d "$FAM_CONFIG" ] && mkdir -p "$(dirname "$FAM_CONFIG")"
    [ ! -d "$FAM_STATE" ] && mkdir -p "$(dirname "$FAM_STATE")"
    [ ! -d "$(dirname "$FAM_LOCK")" ] && mkdir -p "$(dirname "$FAM_LOCK")"
}

# Initialize default config
init_config() {
    if [ ! -f "$FAM_CONFIG" ]; then
        cat > "$FAM_CONFIG" << 'EOF'
{
  "router_id": "FAM-XXXX",
  "global_settings": {
    "dns_provider": "nextdns",
    "quarantine_new": true
  },
  "profiles": []
}
EOF
        log "Initialized default config"
    fi
}

# Signal handling
trap 'release_lock; exit 0' INT TERM

release_lock() {
    rm -f "$FAM_LOCK/agent.pid" 2>/dev/null
}

# Plugin loader
load_plugin() {
    local name="$1"
    local script="$FAM_PLUGINS/${name}.sh"

    if [ -x "$script" ]; then
        . "$script"
    else
        log_err "Plugin not found: $name"
        return 1
    fi
}

# Main agent loop
agent_loop() {
    log "=== Agent starting (Router: $(jq -r '.router_id' "$FAM_CONFIG" 2>/dev/null) ==="

    # Ensure config exists
    if [ ! -f "$FAM_CONFIG" ]; then
        log_err "Config not found"
        exit 1
    fi

    # Start state polling in background
    if [ -x "$FAM_SCRIPTS/poll-state.sh" ]; then
        "$FAM_SCRIPTS/poll-state.sh" &
        log "State polling started"
    fi

    # Main polling loop
    while true; do
        # Load config
        local profiles
        profiles=$(jq -r '.profiles[]' "$FAM_CONFIG" 2>/dev/null)

        # Iterate through profiles
        for profile in $profiles; do
            local macs
            macs=$(jq -r --arg profile ".macs[]" "$profile" 2>/dev/null)

            # Call DNS plugin for each MAC
            for mac in $macs; do
                load_plugin dns "$mac"
            done
        done

        sleep 60
    done
}

# Setup
ensure_dirs
init_config

# Run
agent_loop
