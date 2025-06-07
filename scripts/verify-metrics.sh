#!/bin/bash

# TerraFusionPro Metrics Verification Script

# Configuration
ENVIRONMENT=${1:-"staging"}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/terrafusionpro/metrics_${TIMESTAMP}.log"
ERROR_LOG="/var/log/terrafusionpro/metrics_${TIMESTAMP}_error.log"

# Environment-specific configurations
case $ENVIRONMENT in
  "production")
    PROMETHEUS_URL="https://prometheus.terrafusionpro.com"
    GRAFANA_URL="https://grafana.terrafusionpro.com"
    ALERTMANAGER_URL="https://alertmanager.terrafusionpro.com"
    ;;
  "staging")
    PROMETHEUS_URL="https://prometheus-staging.terrafusionpro.com"
    GRAFANA_URL="https://grafana-staging.terrafusionpro.com"
    ALERTMANAGER_URL="https://alertmanager-staging.terrafusionpro.com"
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

# Verify Prometheus metrics
verify_prometheus() {
  log "Verifying Prometheus metrics..."
  
  # Check Prometheus health
  if ! curl -f "${PROMETHEUS_URL}/-/healthy"; then
    handle_error "Prometheus health check failed"
  fi
  
  # Check metric collection
  if ! curl -f "${PROMETHEUS_URL}/api/v1/query?query=up" | grep -q "1"; then
    handle_error "Prometheus metric collection check failed"
  fi
  
  # Check for high error rates
  ERROR_RATE=$(curl -s "${PROMETHEUS_URL}/api/v1/query?query=rate(http_requests_total{status=~'5..'}[5m])" | jq -r '.data.result[0].value[1]')
  if (( $(echo "$ERROR_RATE > 0.01" | bc -l) )); then
    handle_error "High error rate detected: $ERROR_RATE"
  fi
  
  log "Prometheus metrics verification passed"
}

# Verify Grafana dashboards
verify_grafana() {
  log "Verifying Grafana dashboards..."
  
  # Check Grafana health
  if ! curl -f "${GRAFANA_URL}/api/health"; then
    handle_error "Grafana health check failed"
  fi
  
  # Check dashboard availability
  if ! curl -f "${GRAFANA_URL}/api/dashboards/uid/terrafusionpro"; then
    handle_error "Grafana dashboard check failed"
  fi
  
  # Check alert rules
  if ! curl -f "${GRAFANA_URL}/api/alerts"; then
    handle_error "Grafana alert rules check failed"
  fi
  
  log "Grafana verification passed"
}

# Verify AlertManager
verify_alertmanager() {
  log "Verifying AlertManager..."
  
  # Check AlertManager health
  if ! curl -f "${ALERTMANAGER_URL}/-/healthy"; then
    handle_error "AlertManager health check failed"
  fi
  
  # Check alert configuration
  if ! curl -f "${ALERTMANAGER_URL}/api/v2/status"; then
    handle_error "AlertManager configuration check failed"
  fi
  
  # Check for active alerts
  ACTIVE_ALERTS=$(curl -s "${ALERTMANAGER_URL}/api/v2/alerts" | jq '. | length')
  if [ "$ACTIVE_ALERTS" -gt 0 ]; then
    handle_error "Active alerts detected: $ACTIVE_ALERTS"
  fi
  
  log "AlertManager verification passed"
}

# Verify application metrics
verify_app_metrics() {
  log "Verifying application metrics..."
  
  # Check response time
  RESPONSE_TIME=$(curl -s "${PROMETHEUS_URL}/api/v1/query?query=histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))" | jq -r '.data.result[0].value[1]')
  if (( $(echo "$RESPONSE_TIME > 1" | bc -l) )); then
    handle_error "High response time detected: $RESPONSE_TIME seconds"
  fi
  
  # Check memory usage
  MEMORY_USAGE=$(curl -s "${PROMETHEUS_URL}/api/v1/query?query=process_resident_memory_bytes" | jq -r '.data.result[0].value[1]')
  if (( $(echo "$MEMORY_USAGE > 1073741824" | bc -l) )); then
    handle_error "High memory usage detected: $MEMORY_USAGE bytes"
  fi
  
  # Check CPU usage
  CPU_USAGE=$(curl -s "${PROMETHEUS_URL}/api/v1/query?query=rate(process_cpu_seconds_total[5m])" | jq -r '.data.result[0].value[1]')
  if (( $(echo "$CPU_USAGE > 0.8" | bc -l) )); then
    handle_error "High CPU usage detected: $CPU_USAGE"
  fi
  
  log "Application metrics verification passed"
}

# Verify business metrics
verify_business_metrics() {
  log "Verifying business metrics..."
  
  # Check user activity
  ACTIVE_USERS=$(curl -s "${PROMETHEUS_URL}/api/v1/query?query=sum(active_users)" | jq -r '.data.result[0].value[1]')
  if [ "$ACTIVE_USERS" -lt 1 ]; then
    handle_error "No active users detected"
  fi
  
  # Check transaction rate
  TRANSACTION_RATE=$(curl -s "${PROMETHEUS_URL}/api/v1/query?query=rate(transactions_total[5m])" | jq -r '.data.result[0].value[1]')
  if (( $(echo "$TRANSACTION_RATE < 0.1" | bc -l) )); then
    handle_error "Low transaction rate detected: $TRANSACTION_RATE"
  fi
  
  # Check error rate
  ERROR_RATE=$(curl -s "${PROMETHEUS_URL}/api/v1/query?query=rate(errors_total[5m])" | jq -r '.data.result[0].value[1]')
  if (( $(echo "$ERROR_RATE > 0.01" | bc -l) )); then
    handle_error "High error rate detected: $ERROR_RATE"
  fi
  
  log "Business metrics verification passed"
}

# Main verification process
main() {
  log "Starting metrics verification for environment: $ENVIRONMENT"
  
  # Create log directories if they don't exist
  mkdir -p "$(dirname "$LOG_FILE")"
  mkdir -p "$(dirname "$ERROR_LOG")"
  
  # Run verifications
  verify_prometheus
  verify_grafana
  verify_alertmanager
  verify_app_metrics
  verify_business_metrics
  
  log "Metrics verification completed successfully"
}

# Execute main process
main 