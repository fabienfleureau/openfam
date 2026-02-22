#!/bin/ash

NEXTDNS_BIN="/usr/sbin/nextdns"

nextdns_available() {
    [ -x "$NEXTDNS_BIN" ]
}

build_nextdns_command() {
    local mappings="$1"
    
    # Get the default profile ID from config
    local default_profile_id=$(jq -r '.nextdns.profiles[.general.nextdns_default_profile].id // .general.nextdns_default_profile' "/etc/openfam/config.json")

    local cmd="$NEXTDNS_BIN config set"
    
    # Always set the main profile ID using --profile
    if [ -n "$default_profile_id" ] && [ "$default_profile_id" != "null" ]; then
        cmd="$cmd --profile $default_profile_id"
    fi

    if [ -z "$mappings" ]; then
        echo "$cmd"
        return 0
    fi

    # Use printf for safer processing
    local sorted_mappings=$(printf '%s' "$mappings" | tr ',' '\n' | sort)
    for mapping in $sorted_mappings; do
        if [ -n "$mapping" ]; then
            cmd="$cmd --profile $mapping"
        fi
    done
    echo "$cmd"
}

execute_nextdns_config() {
    local mappings="$1"
    local cmd=$(build_nextdns_command "$mappings")

    if [ -z "$cmd" ] || [ "$cmd" = "$NEXTDNS_BIN config" ]; then
        log "No devices to configure"
        return 0
    fi

    log "Executing: $cmd"
    eval "$cmd" >> "$FAM_LOG" 2>&1
}
