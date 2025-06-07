#!/bin/bash

# TerraFusionPro Deployment Automation Script

# Configuration
DEPLOY_ROOT="/opt/terrafusionpro"
ENVIRONMENT=${1:-"production"}
VERSION=${2:-"latest"}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${DEPLOY_ROOT}/logs/deploy_${TIMESTAMP}.log"
ERROR_LOG="${DEPLOY_ROOT}/logs/deploy_${TIMESTAMP}_error.log"

# Environment-specific configurations
case $ENVIRONMENT in
  "production")
    KUBE_NAMESPACE="terrafusionpro-prod"
    REPLICAS=3
    RESOURCES="requests.cpu=500m,requests.memory=1Gi,limits.cpu=1000m,limits.memory=2Gi"
    ;;
  "staging")
    KUBE_NAMESPACE="terrafusionpro-staging"
    REPLICAS=2
    RESOURCES="requests.cpu=250m,requests.memory=512Mi,limits.cpu=500m,limits.memory=1Gi"
    ;;
  "development")
    KUBE_NAMESPACE="terrafusionpro-dev"
    REPLICAS=1
    RESOURCES="requests.cpu=100m,requests.memory=256Mi,limits.cpu=200m,limits.memory=512Mi"
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

# Pre-deployment checks
pre_deploy_checks() {
  log "Starting pre-deployment checks..."
  
  # Check disk space
  DISK_SPACE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
  if [ "$DISK_SPACE" -gt 85 ]; then
    handle_error "Insufficient disk space: ${DISK_SPACE}% used"
  fi
  
  # Check memory
  MEMORY_USAGE=$(free | awk '/Mem:/ {print $3/$2 * 100.0}' | cut -d. -f1)
  if [ "$MEMORY_USAGE" -gt 85 ]; then
    handle_error "High memory usage: ${MEMORY_USAGE}%"
  fi
  
  # Check database connectivity
  if ! kubectl exec -n $KUBE_NAMESPACE deploy/db-check -- pg_isready; then
    handle_error "Database connectivity check failed"
  fi
  
  log "Pre-deployment checks completed successfully"
}

# Backup current version
backup_current_version() {
  log "Backing up current version..."
  
  # Backup Kubernetes resources
  kubectl get all -n $KUBE_NAMESPACE -o yaml > "${DEPLOY_ROOT}/backups/${TIMESTAMP}_k8s_backup.yaml"
  
  # Backup configurations
  tar -czf "${DEPLOY_ROOT}/backups/${TIMESTAMP}_config_backup.tar.gz" "${DEPLOY_ROOT}/config"
  
  log "Backup completed successfully"
}

# Deploy new version
deploy_new_version() {
  log "Deploying new version: $VERSION"
  
  # Update Kubernetes deployment
  kubectl set image deployment/terrafusionpro -n $KUBE_NAMESPACE \
    terrafusionpro=terrafusionpro:$VERSION
  
  # Update resources
  kubectl set resources deployment/terrafusionpro -n $KUBE_NAMESPACE \
    --requests=$RESOURCES --limits=$RESOURCES
  
  # Scale deployment
  kubectl scale deployment terrafusionpro -n $KUBE_NAMESPACE --replicas=$REPLICAS
  
  log "Deployment completed successfully"
}

# Run database migrations
run_migrations() {
  log "Running database migrations..."
  
  # Run migration job
  kubectl create job --from=cronjob/db-migration -n $KUBE_NAMESPACE "migration-${TIMESTAMP}"
  
  # Wait for migration completion
  kubectl wait --for=condition=complete -n $KUBE_NAMESPACE job/migration-${TIMESTAMP} --timeout=300s
  
  log "Database migrations completed successfully"
}

# Verify deployment
verify_deployment() {
  log "Verifying deployment..."
  
  # Check pod status
  kubectl rollout status deployment/terrafusionpro -n $KUBE_NAMESPACE --timeout=300s
  
  # Check service health
  if ! curl -f http://localhost:8080/health; then
    handle_error "Service health check failed"
  fi
  
  # Check metrics
  if ! curl -f http://localhost:8080/metrics; then
    handle_error "Metrics endpoint check failed"
  fi
  
  log "Deployment verification completed successfully"
}

# Rollback procedure
rollback() {
  log "Initiating rollback..."
  
  # Restore Kubernetes resources
  kubectl apply -f "${DEPLOY_ROOT}/backups/${TIMESTAMP}_k8s_backup.yaml"
  
  # Restore configurations
  tar -xzf "${DEPLOY_ROOT}/backups/${TIMESTAMP}_config_backup.tar.gz" -C "${DEPLOY_ROOT}"
  
  log "Rollback completed successfully"
}

# Main deployment process
main() {
  log "Starting deployment process for environment: $ENVIRONMENT, version: $VERSION"
  
  # Create necessary directories
  mkdir -p "${DEPLOY_ROOT}/logs" "${DEPLOY_ROOT}/backups"
  
  # Execute deployment steps
  pre_deploy_checks || handle_error "Pre-deployment checks failed"
  backup_current_version || handle_error "Backup failed"
  deploy_new_version || handle_error "Deployment failed"
  run_migrations || handle_error "Database migrations failed"
  verify_deployment || {
    log "Deployment verification failed, initiating rollback"
    rollback
    handle_error "Deployment failed and rolled back"
  }
  
  log "Deployment completed successfully"
}

# Execute main process
main 