#!/bin/ash
. /etc/fam/lib/log.sh

NEXTDNS_BIN="/usr/sbin/nextdns"

nextdns_available() {
    [ -x "$NEXTDNS_BIN" ]
}

build_nextdns_command() {
    local mappings="$1"
    [ -z "$mappings" ] && return

    local cmd="$NEXTDNS_BIN config"
    echo "$mappings" | tr ',' '\n' | sort | while read -r mapping; do
        [ -n "$mapping" ] && cmd="$cmd --device $mapping"
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
