#!/bin/bash

# TerraFusionPro Enterprise Deployment Script
# Version: 1.0.0
# Author: TerraFusionPro Team

# Configuration
DEPLOY_ROOT="/opt/terrafusionpro"
ENV=$1
VERSION=$2
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/terrafusionpro/deploy.log"
ERROR_LOG="/var/log/terrafusionpro/deploy_error.log"

# Environment-specific configurations
case $ENV in
  "production")
    KUBERNETES_NAMESPACE="terrafusionpro-prod"
    REPLICAS=3
    RESOURCES="high"
    ;;
  "staging")
    KUBERNETES_NAMESPACE="terrafusionpro-staging"
    REPLICAS=2
    RESOURCES="medium"
    ;;
  "development")
    KUBERNETES_NAMESPACE="terrafusionpro-dev"
    REPLICAS=1
    RESOURCES="low"
    ;;
  *)
    echo "Invalid environment: $ENV"
    exit 1
    ;;
esac

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

error_log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - ERROR: $1" >> "$ERROR_LOG"
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."
    
    # Check disk space
    if ! df -h | grep -q "90%"; then
        error_log "Insufficient disk space"
        return 1
    fi
    
    # Check memory
    if ! free -m | grep "Mem:" | awk '{print $3/$2 * 100.0}' | awk '{if ($1 > 90) exit 1}'; then
        error_log "Insufficient memory"
        return 1
    fi
    
    # Check database connectivity
    if ! pg_isready -h localhost -p 5432; then
        error_log "Database not ready"
        return 1
    fi
    
    log "Pre-deployment checks passed"
    return 0
}

# Backup current version
backup_current_version() {
    log "Backing up current version..."
    local backup_dir="$DEPLOY_ROOT/backups/$TIMESTAMP"
    
    mkdir -p "$backup_dir"
    cp -r "$DEPLOY_ROOT/current" "$backup_dir/"
    
    if [ $? -eq 0 ]; then
        log "Backup completed successfully"
        return 0
    else
        error_log "Backup failed"
        return 1
    fi
}

# Deploy new version
deploy_new_version() {
    log "Deploying version $VERSION..."
    
    # Update Kubernetes deployment
    kubectl set image deployment/terrafusionpro \
        terrafusionpro=terrafusionpro:$VERSION \
        -n $KUBERNETES_NAMESPACE
    
    # Scale deployment
    kubectl scale deployment terrafusionpro \
        --replicas=$REPLICAS \
        -n $KUBERNETES_NAMESPACE
    
    # Apply resource limits
    kubectl patch deployment terrafusionpro \
        -n $KUBERNETES_NAMESPACE \
        -p "{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"terrafusionpro\",\"resources\":{\"limits\":{\"cpu\":\"$RESOURCES\",\"memory\":\"$RESOURCES\"}}}}}}}"
    
    if [ $? -eq 0 ]; then
        log "Deployment completed successfully"
        return 0
    else
        error_log "Deployment failed"
        return 1
    fi
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Run migrations
    cd "$DEPLOY_ROOT/current" && \
    npm run migrate:up
    
    if [ $? -eq 0 ]; then
        log "Migrations completed successfully"
        return 0
    else
        error_log "Migrations failed"
        return 1
    fi
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check pod status
    kubectl get pods -n $KUBERNETES_NAMESPACE | grep -q "Running"
    if [ $? -ne 0 ]; then
        error_log "Pods not running"
        return 1
    fi
    
    # Check application health
    curl -f http://localhost:3000/health
    if [ $? -ne 0 ]; then
        error_log "Health check failed"
        return 1
    fi
    
    # Check database connectivity
    curl -f http://localhost:3000/db/health
    if [ $? -ne 0 ]; then
        error_log "Database health check failed"
        return 1
    fi
    
    log "Deployment verification successful"
    return 0
}

# Rollback if needed
rollback() {
    log "Initiating rollback..."
    
    # Revert Kubernetes deployment
    kubectl rollout undo deployment/terrafusionpro -n $KUBERNETES_NAMESPACE
    
    # Restore from backup
    local latest_backup=$(ls -t "$DEPLOY_ROOT/backups" | head -n1)
    cp -r "$DEPLOY_ROOT/backups/$latest_backup"/* "$DEPLOY_ROOT/current/"
    
    if [ $? -eq 0 ]; then
        log "Rollback completed successfully"
        return 0
    else
        error_log "Rollback failed"
        return 1
    fi
}

# Main deployment process
main() {
    log "Starting TerraFusionPro deployment process..."
    
    # Create log directories if they don't exist
    mkdir -p "$(dirname "$LOG_FILE")"
    mkdir -p "$(dirname "$ERROR_LOG")"
    
    # Run deployment steps
    pre_deployment_checks || exit 1
    backup_current_version || exit 1
    deploy_new_version || { rollback; exit 1; }
    run_migrations || { rollback; exit 1; }
    verify_deployment || { rollback; exit 1; }
    
    log "Deployment process completed successfully"
}

# Error handling
set -e
trap 'error_log "Deployment process failed at line $LINENO"' ERR

# Run main process
main 