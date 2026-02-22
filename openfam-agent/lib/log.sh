#!/bin/ash
FAM_LOG_DIR="/etc/openfam/logs"
FAM_LOG="$FAM_LOG_DIR/fam.log"

ensure_log_dir() {
    if [ ! -d "$FAM_LOG_DIR" ]; then
        mkdir -p "$FAM_LOG_DIR"
    fi
}

log() {
    ensure_log_dir
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$FAM_LOG"
}

log_err() {
    ensure_log_dir
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*" >> "$FAM_LOG"
}
