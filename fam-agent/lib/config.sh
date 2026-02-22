#!/bin/ash

FAM_CONFIG="/etc/openfam/config.json"

get_timezone() {
    jq -r '.general.timezone // "UTC"' "$FAM_CONFIG"
}

get_default_profile() {
    jq -r '.general.nextdns_default_profile // "default"' "$FAM_CONFIG"
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
