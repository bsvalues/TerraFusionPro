#!/bin/bash

# TerraFusionPro Health Check Script

# Configuration
ENVIRONMENT=${1:-"staging"}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/terrafusionpro/health_${TIMESTAMP}.log"
ERROR_LOG="/var/log/terrafusionpro/health_${TIMESTAMP}_error.log"

# Environment-specific configurations
case $ENVIRONMENT in
  "production")
    API_URL="https://api.terrafusionpro.com"
    HEALTH_ENDPOINT="/health"
    METRICS_ENDPOINT="/metrics"
    DB_HOST="db-prod.terrafusionpro.com"
    REDIS_HOST="redis-prod.terrafusionpro.com"
    ;;
  "staging")
    API_URL="https://api-staging.terrafusionpro.com"
    HEALTH_ENDPOINT="/health"
    METRICS_ENDPOINT="/metrics"
    DB_HOST="db-staging.terrafusionpro.com"
    REDIS_HOST="redis-staging.terrafusionpro.com"
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

# Check API health
check_api_health() {
  log "Checking API health..."
  
  # Check main health endpoint
  if ! curl -f "${API_URL}${HEALTH_ENDPOINT}"; then
    handle_error "API health check failed"
  fi
  
  # Check metrics endpoint
  if ! curl -f "${API_URL}${METRICS_ENDPOINT}"; then
    handle_error "Metrics endpoint check failed"
  fi
  
  log "API health check passed"
}

# Check database health
check_db_health() {
  log "Checking database health..."
  
  # Check database connectivity
  if ! pg_isready -h "$DB_HOST" -p 5432; then
    handle_error "Database connectivity check failed"
  fi
  
  # Check database performance
  if ! psql -h "$DB_HOST" -U postgres -d terrafusionpro -c "SELECT 1"; then
    handle_error "Database query check failed"
  fi
  
  log "Database health check passed"
}

# Check Redis health
check_redis_health() {
  log "Checking Redis health..."
  
  # Check Redis connectivity
  if ! redis-cli -h "$REDIS_HOST" ping; then
    handle_error "Redis connectivity check failed"
  fi
  
  # Check Redis memory usage
  MEMORY_USAGE=$(redis-cli -h "$REDIS_HOST" info memory | grep "used_memory_human" | cut -d: -f2)
  if [ "$MEMORY_USAGE" -gt "1G" ]; then
    handle_error "Redis memory usage too high: $MEMORY_USAGE"
  fi
  
  log "Redis health check passed"
}

# Check system resources
check_system_resources() {
  log "Checking system resources..."
  
  # Check CPU usage
  CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d. -f1)
  if [ "$CPU_USAGE" -gt 85 ]; then
    handle_error "CPU usage too high: $CPU_USAGE%"
  fi
  
  # Check memory usage
  MEMORY_USAGE=$(free | awk '/Mem:/ {print $3/$2 * 100.0}' | cut -d. -f1)
  if [ "$MEMORY_USAGE" -gt 85 ]; then
    handle_error "Memory usage too high: $MEMORY_USAGE%"
  fi
  
  # Check disk space
  DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
  if [ "$DISK_USAGE" -gt 85 ]; then
    handle_error "Disk usage too high: $DISK_USAGE%"
  fi
  
  log "System resources check passed"
}

# Check network connectivity
check_network() {
  log "Checking network connectivity..."
  
  # Check internal network
  if ! ping -c 1 "$DB_HOST"; then
    handle_error "Internal network check failed"
  fi
  
  # Check external network
  if ! ping -c 1 8.8.8.8; then
    handle_error "External network check failed"
  fi
  
  log "Network connectivity check passed"
}

# Check application logs
check_logs() {
  log "Checking application logs..."
  
  # Check for error patterns in logs
  if grep -i "error\|exception\|fatal" /var/log/terrafusionpro/app.log; then
    handle_error "Found errors in application logs"
  fi
  
  log "Application logs check passed"
}

# Main health check process
main() {
  log "Starting health check for environment: $ENVIRONMENT"
  
  # Create log directories if they don't exist
  mkdir -p "$(dirname "$LOG_FILE")"
  mkdir -p "$(dirname "$ERROR_LOG")"
  
  # Run health checks
  check_api_health
  check_db_health
  check_redis_health
  check_system_resources
  check_network
  check_logs
  
  log "Health check completed successfully"
}

# Execute main process
main 