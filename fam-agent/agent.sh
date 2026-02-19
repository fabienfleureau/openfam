#!/bin/ash
# Open-F.A.M. Router Agent - Polls config and applies NextDNS profiles

set -e

FAM_DIR="/etc/fam"
FAM_CONFIG="$FAM_DIR/config.toml"
FAM_LIB="$FAM_DIR/lib"
FAM_LAST_CMD="$FAM_DIR/last-command.txt"

# Load libraries
. "$FAM_LIB/log.sh"
. "$FAM_LIB/config.sh"
. "$FAM_LIB/schedule.sh"
. "$FAM_LIB/nextdns.sh"

# Prevent concurrent execution
FAM_LOCK="/var/run/fam-agent.pid"
if [ -f "$FAM_LOCK" ]; then
    old_pid=$(cat "$FAM_LOCK" 2>/dev/null)
    if [ -n "$old_pid" ] && kill -0 "$old_pid" 2>/dev/null; then
        log "Agent already running (PID: $old_pid)"
        exit 0
    fi
fi
echo $$ > "$FAM_LOCK"
trap 'rm -f "$FAM_LOCK"' EXIT

log "=== Agent run started ==="

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

# Build device mappings from TOML config
# Simplified parser for ash
parse_profiles() {
    local in_profile=0
    local in_macs=0
    local profile_name=""
    local profile_default=""
    local mac_address=""
    local result=""

    while IFS= read -r line; do
        case "$line" in
            ''|\#*) continue ;;
        esac

        if echo "$line" | grep -q '^\[\[profiles\]\]'; then
            in_profile=1
            in_macs=0
            profile_name=""
            profile_default=""
            continue
        fi

        if [ $in_profile -eq 1 ]; then
            if echo "$line" | grep -q '^\[\['; then
                in_profile=0
                continue
            fi

            case "$line" in
                name\ =*)
                    profile_name=$(echo "$line" | sed 's/.*= *"\([^"]*\)".*/\1/')
                    ;;
                default_nextdns\ =*)
                    profile_default=$(echo "$line" | sed 's/.*= *"\([^"]*\)".*/\1/')
                    ;;
                \[\[profiles.macs\]\])
                    in_macs=1
                    ;;
                address\ =*)
                    if [ $in_macs -eq 1 ]; then
                        mac_address=$(echo "$line" | sed 's/.*= *"\([^"]*\)".*/\1/' | tr 'a-z' 'A-Z')
                        if [ -n "$mac_address" ]; then
                            if [ -n "$result" ]; then
                                result="$result,$mac_address=$profile_default"
                            else
                                result="$mac_address=$profile_default"
                            fi
                        fi
                    fi
                    ;;
                name\ =*\")  # MAC name entry, skip
                    ;;
            esac
        fi
    done < "$FAM_CONFIG"

    echo "$result"
}

DEVICE_MAPPINGS=$(parse_profiles)

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
