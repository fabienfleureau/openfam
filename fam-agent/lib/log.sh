#!/bin/ash
FAM_LOG_DIR="/etc/fam/logs"
FAM_LOG="$FAM_LOG_DIR/fam.log"

ensure_log_dir() {
    [ ! -d "$FAM_LOG_DIR" ] && mkdir -p "$FAM_LOG_DIR"
}

log() {
    ensure_log_dir
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$FAM_LOG"
}

log_err() {
    ensure_log_dir
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*" >> "$FAM_LOG"
}
