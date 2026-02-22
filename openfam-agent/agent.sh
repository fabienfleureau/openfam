#!/bin/ash
# OpenFAM Router Agent - Polls config and applies NextDNS profiles

set -e

FAM_DIR="/etc/openfam"
FAM_CONFIG="$FAM_DIR/config.json"
FAM_LIB="$FAM_DIR/lib"
FAM_LAST_CMD="$FAM_DIR/last-command.txt"
FAM_LOG_DIR="$FAM_DIR/logs"

# Ensure log directory exists immediately
mkdir -p "$FAM_LOG_DIR"

# Load libraries
. "$FAM_LIB/log.sh"
. "$FAM_LIB/config.sh"
. "$FAM_LIB/schedule.sh"
. "$FAM_LIB/nextdns.sh"

log "=== Agent run started ==="

# Prevent concurrent execution
FAM_LOCK="/var/run/openfam-agent.pid"
if [ -f "$FAM_LOCK" ]; then
    old_pid=$(cat "$FAM_LOCK" 2>/dev/null)
    if [ -n "$old_pid" ] && kill -0 "$old_pid" 2>/dev/null; then
        log "Agent already running (PID: $old_pid)"
        exit 0
    fi
fi
echo $$ > "$FAM_LOCK"
trap 'rm -f "$FAM_LOCK"' EXIT

# Validate config
if ! validate_config; then
    log_err "Config validation failed"
    exit 1
fi

# Set timezone
TZ=$(get_timezone)
export TZ

CURRENT_DAY=$(get_current_day)
CURRENT_TIME=$(get_current_time)
log "Current: $CURRENT_DAY $CURRENT_TIME (TZ: $TZ)"

# Build device mappings from JSON config
parse_profiles() {
    local day=$(get_current_day)
    local time=$(get_current_time)
    
    jq -r --arg day "$day" --arg time "$time" '
        def to_min: split(":") | (.[0]|tonumber)*60 + (.[1]|tonumber);
        def is_in_range(s; e; c):
            (s | to_min) as $s_min | (e | to_min) as $e_min | (c | to_min) as $c_min |
            if $e_min < $s_min then ($c_min >= $s_min or $c_min < $e_min) else ($c_min >= $s_min and $c_min < $e_min) end;
        
        . as $root |
        [
            .profiles[] | . as $p |
            ((.schedule[]? | select(.days[] == $day and is_in_range(.time_start; .time_end; $time)) | .nextdns) // .default_nextdns) as $active |
            ($root.nextdns.profiles[$active].id // $active) as $id |
            .macs[] | "\(.address | ascii_upcase)=\($id)"
        ] | join(",")
    ' "$FAM_CONFIG"
}

DEVICE_MAPPINGS=$(parse_profiles)

if [ -z "$DEVICE_MAPPINGS" ]; then
    log "No devices found in configuration, skipping NextDNS update"
    log "=== Agent run completed ==="
    exit 0
fi

# Build NextDNS command
NEW_COMMAND=$(build_nextdns_command "$DEVICE_MAPPINGS")

# Compare with last command
if [ -f "$FAM_LAST_CMD" ]; then
    LAST_COMMAND=$(cat "$FAM_LAST_CMD")
else
    LAST_COMMAND=""
fi

if [ "$NEW_COMMAND" != "$LAST_COMMAND" ]; then
    log "Configuration changed, applying..."
    execute_nextdns_config "$DEVICE_MAPPINGS"
    echo "$NEW_COMMAND" > "$FAM_LAST_CMD"
    log "Configuration applied"
else
    log "No changes detected, skipping"
fi

log "=== Agent run completed ==="
