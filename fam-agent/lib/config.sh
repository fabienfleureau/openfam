#!/bin/ash
. /etc/fam/lib/log.sh

FAM_CONFIG="/etc/fam/config.toml"

get_timezone() {
    awk -F'=' '/^timezone\s*=/ {gsub(/[" \t]/, "", $2); print $2; exit}' "$FAM_CONFIG"
}

get_default_profile() {
    awk -F'=' '/^nextdns_default_profile\s*=/ {gsub(/[" \t]/, "", $2); print $2; exit}' "$FAM_CONFIG"
}

config_exists() {
    [ -f "$FAM_CONFIG" ]
}

validate_config() {
    if [ ! -f "$FAM_CONFIG" ]; then
        log_err "Config not found: $FAM_CONFIG"
        return 1
    fi
    return 0
}
