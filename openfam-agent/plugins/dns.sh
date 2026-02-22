#!/bin/ash
# OpenFAM DNS Plugin
# Manages dnsmasq configuration for DNS filtering

set -e

# Apply DNS profile
apply_profile() {
    local profile_name="$1"
    local servers=''

    case "$profile_name" in
        nextdns*)
            servers="https://dns.nextdns.io/dns-query"
            ;;
        adguard*)
            servers="https://dns.adguard-dns.com/dns-query"
            ;;
        opendns*)
            servers="https://resolver1.opendns.com/dns-query"
            ;;
        *)
            log "Unknown DNS profile: $profile_name"
            return 1
            ;;
    esac

    log "Applying DNS profile: $profile_name -> $servers"

    # Configure dnsmasq to use these servers
    uci delete dhcp.@dnsmasq[0].server
    uci set dhcp.@dnsmasq[0].server="$servers"
    uci set dhcp.@dnsmasq[0].enabled='1'
    uci set dhcp.@dnsmasq[0].address='/'
    uci commit dhcp

    log "DNS configuration updated"
}

# Restore default DNS
restore_default() {
    log "Restoring default DNS settings"
    uci delete dhcp.@dnsmasq
    uci commit dhcp
}

# Command routing
case "$1" in
    apply)
        local profile="$2"
        if [ -n "$profile" ]; then
            log "Usage: $0 apply <profile_name>"
            exit 1
        fi
        apply_profile "$profile"
        ;;
    restore)
        restore_default
        ;;
    *)
        log "Unknown command: $1"
        exit 1
        ;;
esac
