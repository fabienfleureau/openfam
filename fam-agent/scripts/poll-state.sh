#!/bin/ash
# OpenFAM State Management
# Handles config polling from cloud API and state reporting

set -e

CLOUD_API_BASE="${CLOUD_API_BASE:-https://api.openfam.com}"
ROUTER_ID="${ROUTER_ID:-FAM-XXXX}"
POLL_INTERVAL=60  # seconds between config polls

# Current state cache
STATE_CACHE="/var/run/fam/state.json"

# Initialize state cache
init_state() {
    mkdir -p "$(dirname "$STATE_CACHE")"
    echo '{"last_poll":0,"profiles":[],"devices":[]}' > "$STATE_CACHE"
}

# Save state to cache
save_state() {
    local state="$1"
    echo "$state" > "$STATE_CACHE"
}

# Load state from cache
load_state() {
    cat "$STATE_CACHE" 2>/dev/null
}

# Poll configuration from cloud API
poll_config() {
    local last_poll=$(load_state | jq -r '.last_poll // 0')
    local now=$(date +%s)

    log "Polling config from $CLOUD_API_BASE/routers/$ROUTER_ID/config"

    local response=$(curl -s "$CLOUD_API_BASE/routers/$ROUTER_ID/config" 2>/dev/null)
    local http_code=$(echo "$response" | jq -r '.status // 0')

    if [ "$http_code" -eq 200 ]; then
        local new_config=$(echo "$response" | jq -r '.config')

        # Update config file
        echo "$new_config" > /etc/fam/config.json

        # Update last poll time
        local updated_state=$(load_state | jq ".last_poll = $now" | jq -r '.last_poll = $now')
        save_state "$updated_state"

        log "Config updated successfully"
        return 0
    else
        log "Failed to poll config: HTTP $http_code"
        return 1
    fi
}

# Report device discovery to cloud
report_devices() {
    local state=$(load_state)
    local devices=$(echo "$state" | jq -r '.devices // []')

    log "Reporting devices: $devices"

    local payload=$(jq -n \
        --arg router_id "$ROUTER_ID" \
        --arg devices "$devices" \
        '{"router_id":"$ROUTER_ID","devices":$devices}')

    curl -s -X POST "$CLOUD_API_BASE/routers/$ROUTER_ID/devices" \
        -H "Content-Type: application/json" \
        -d "$payload" 2>/dev/null
}

# Main loop
main() {
    log "=== State Management starting ==="

    # Initialize state if not exists
    if [ ! -f "$STATE_CACHE" ]; then
        init_state
    fi

    # Polling loop
    while true; do
        poll_config
        sleep $POLL_INTERVAL
    done
}

# Entry point
main
