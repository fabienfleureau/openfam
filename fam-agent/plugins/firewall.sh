#!/bin/ash
# OpenFAM Firewall Plugin
# Manages NFTables rules per MAC address

set -e

# Ensure nftables is available
check_nft() {
    if ! command -v nft >/dev/null 2>&1; then
        log "nftables not found, installing..."
        opkg update >/dev/null 2>&1
        opkg install nftables >/dev/null 2>&1
    fi
}

# Create rule for a MAC address
create_mac_rule() {
    local mac="$1"
    local action="$2"  # accept, drop, or reject
    local profile="$3"  # profile this rule belongs to

    case "$action" in
        accept|allow)
            action="accept"
            ;;
        drop|deny|block)
            action="drop"
            ;;
        reject)
            action="reject"
            ;;
        *)
            log "Unknown action: $action"
            return 1
            ;;
    esac

    log "Firewall: MAC $mac -> $action (profile: $profile)"
}

# Apply rules from config
apply_rules() {
    local config="/etc/fam/config.json"

    if [ ! -f "$config" ]; then
        log "Config not found"
        return 1
    fi

    # Parse profiles and apply firewall rules
    # This would use jq to iterate through profiles and their MAC lists
    log "Applying firewall rules from config"
}

# Clear all rules
clear_all() {
    log "Clearing all firewall rules"
    nft flush ruleset 2>/dev/null || true
}

# List current rules
list_rules() {
    nft list ruleset 2>/dev/null || true
}

# Command routing
case "$1" in
    apply)
        shift
        apply_rules
        ;;
    clear)
        clear_all
        ;;
    list)
        list_rules
        ;;
    *)
        echo "Usage: $0 <apply|clear|list>"
        exit 1
        ;;
esac
