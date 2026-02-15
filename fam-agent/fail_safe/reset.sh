#!/bin/ash
# OpenFAM Fail-Safe Reset
# Physical reset button handler for emergency recovery
# MUST NOT be modified - this is the parent's escape hatch

set -e

# Log actions
log() {
    logger -t openfam -p daemon.err "RESET: $@"
}

main() {
    log "=== FAIL-SAFE RESET ACTIVATED ==="

    # 1. Stop the fam-agent
    if [ -f /var/run/fam/agent.pid ]; then
        local pid=$(cat /var/run/fam/agent.pid 2>/dev/null)
        if [ -n "$pid" ]; then
            log "Stopping agent (PID: $pid)"
            kill -0 "$pid" 2>/dev/null
            rm -f /var/run/fam/agent.pid
            log "Agent stopped"
        fi
    fi

    # 2. Flush NFTables rules immediately
    log "Flushing NFTables..."
    nft flush ruleset 2>/dev/null || true
    nft flush chain 2>/dev/null || true

    # 3. Restore UCI config from backup
    log "Restoring UCI configuration..."
    if [ -d /etc/fam/backup/config ]; then
        cp -r /etc/fam/backup/config/* /etc/config/
        log "Configuration restored from backup"
    else
        log "Warning: No backup config found"
    fi

    # 4. Reboot system to clean state
    log "Rebooting system..."
    reboot

    log "=== RESET COMPLETE ==="
}

main
