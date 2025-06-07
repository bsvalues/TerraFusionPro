#!/bin/bash

# TerraFusionPro Log Checking Script

# Configuration
ENVIRONMENT=${1:-"staging"}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/terrafusionpro/log_check_${TIMESTAMP}.log"
ERROR_LOG="/var/log/terrafusionpro/log_check_${TIMESTAMP}_error.log"
LOG_DIR="/var/log/terrafusionpro"

# Environment-specific configurations
case $ENVIRONMENT in
  "production")
    LOG_PATTERNS=(
      "ERROR"
      "FATAL"
      "CRITICAL"
      "Exception"
      "OutOfMemory"
      "Connection refused"
      "Timeout"
      "Failed to connect"
    )
    MAX_ERROR_COUNT=10
    LOG_RETENTION_DAYS=30
    ;;
  "staging")
    LOG_PATTERNS=(
      "ERROR"
      "FATAL"
      "CRITICAL"
      "Exception"
    )
    MAX_ERROR_COUNT=20
    LOG_RETENTION_DAYS=7
    ;;
  *)
    echo "Invalid environment: $ENVIRONMENT"
    exit 1
    ;;
esac

# Logging function
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
handle_error() {
  log "ERROR: $1"
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$ERROR_LOG"
  exit 1
}

# Check log files existence
check_log_files() {
  log "Checking log files..."
  
  # Check main log files
  for log_file in "app.log" "error.log" "access.log"; do
    if [ ! -f "${LOG_DIR}/${log_file}" ]; then
      handle_error "Log file not found: ${log_file}"
    fi
  done
  
  log "Log files check passed"
}

# Check for error patterns
check_error_patterns() {
  log "Checking for error patterns..."
  
  for pattern in "${LOG_PATTERNS[@]}"; do
    ERROR_COUNT=$(grep -c "$pattern" "${LOG_DIR}/app.log")
    if [ "$ERROR_COUNT" -gt "$MAX_ERROR_COUNT" ]; then
      handle_error "Too many errors found for pattern '$pattern': $ERROR_COUNT"
    fi
  done
  
  log "Error patterns check passed"
}

# Check log rotation
check_log_rotation() {
  log "Checking log rotation..."
  
  # Check if logrotate is configured
  if [ ! -f "/etc/logrotate.d/terrafusionpro" ]; then
    handle_error "Logrotate configuration not found"
  fi
  
  # Check if logs are being rotated
  if ! logrotate -d "/etc/logrotate.d/terrafusionpro"; then
    handle_error "Logrotate configuration is invalid"
  fi
  
  log "Log rotation check passed"
}

# Check log retention
check_log_retention() {
  log "Checking log retention..."
  
  # Find old log files
  OLD_LOGS=$(find "$LOG_DIR" -name "*.log.*" -mtime +$LOG_RETENTION_DAYS)
  if [ -n "$OLD_LOGS" ]; then
    handle_error "Found logs older than ${LOG_RETENTION_DAYS} days"
  fi
  
  log "Log retention check passed"
}

# Check log permissions
check_log_permissions() {
  log "Checking log permissions..."
  
  # Check log directory permissions
  if [ "$(stat -c %a "$LOG_DIR")" != "750" ]; then
    handle_error "Invalid log directory permissions"
  fi
  
  # Check log file permissions
  for log_file in "$LOG_DIR"/*.log; do
    if [ "$(stat -c %a "$log_file")" != "640" ]; then
      handle_error "Invalid permissions for log file: $log_file"
    fi
  done
  
  log "Log permissions check passed"
}

# Check log disk usage
check_log_disk_usage() {
  log "Checking log disk usage..."
  
  # Calculate log directory size
  LOG_SIZE=$(du -sh "$LOG_DIR" | cut -f1)
  LOG_SIZE_NUM=$(echo "$LOG_SIZE" | sed 's/[^0-9]//g')
  
  # Check if log size is too large
  if [ "$LOG_SIZE_NUM" -gt 1024 ]; then
    handle_error "Log directory size too large: $LOG_SIZE"
  fi
  
  log "Log disk usage check passed"
}

# Check log format
check_log_format() {
  log "Checking log format..."
  
  # Check timestamp format
  if ! grep -q "^[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\} [0-9]\{2\}:[0-9]\{2\}:[0-9]\{2\}" "${LOG_DIR}/app.log"; then
    handle_error "Invalid timestamp format in logs"
  fi
  
  # Check log level format
  if ! grep -q "\[(INFO|ERROR|WARN|DEBUG)\]" "${LOG_DIR}/app.log"; then
    handle_error "Invalid log level format in logs"
  fi
  
  log "Log format check passed"
}

# Check log aggregation
check_log_aggregation() {
  log "Checking log aggregation..."
  
  # Check if logs are being sent to aggregation service
  if ! curl -f "http://localhost:9200/_cat/indices?v" | grep -q "terrafusionpro-logs"; then
    handle_error "Log aggregation service not receiving logs"
  fi
  
  log "Log aggregation check passed"
}

# Main log checking process
main() {
  log "Starting log check for environment: $ENVIRONMENT"
  
  # Create log directories if they don't exist
  mkdir -p "$(dirname "$LOG_FILE")"
  mkdir -p "$(dirname "$ERROR_LOG")"
  
  # Run checks
  check_log_files
  check_error_patterns
  check_log_rotation
  check_log_retention
  check_log_permissions
  check_log_disk_usage
  check_log_format
  check_log_aggregation
  
  log "Log check completed successfully"
}

# Execute main process
main 