#!/bin/ash
get_current_day() {
    date +%a
}

get_current_time() {
    date +%H:%M
}

is_time_in_range() {
    local start="$1"
    local end="$2"
    local current=$(get_current_time)

    local start_min=$(echo "$start" | awk -F: '{print $1*60 + $2}')
    local end_min=$(echo "$end" | awk -F: '{print $1*60 + $2}')
    local current_min=$(echo "$current" | awk -F: '{print $1*60 + $2}')

    if [ $end_min -lt $start_min ]; then
        [ $current_min -ge $start_min ] || [ $current_min -lt $end_min ]
    else
        [ $current_min -ge $start_min ] && [ $current_min -lt $end_min ]
    fi
}

is_day_in_schedule() {
    local schedule_days="$1"
    local current_day=$(get_current_day)
    echo "$schedule_days" | tr ',' '\n' | grep -q "^${current_day}$"
}
