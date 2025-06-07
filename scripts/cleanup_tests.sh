#!/bin/bash

# Configuration
TEST_DIR="tests"
REPORT_DIR="test-results"
COVERAGE_DIR="coverage"
VENV_DIR=".venv"
TEMP_DIR="temp"
LOG_DIR="logs"
BACKUP_DIR="backups"
DAYS_TO_KEEP=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging function
log() {
    echo -e "${2:-$GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Error handling
handle_error() {
    log "Error: $1" "$RED"
    exit 1
}

# Clean test results
clean_test_results() {
    log "Cleaning test results..."
    
    if [ -d "$REPORT_DIR" ]; then
        find "$REPORT_DIR" -type f -mtime +$DAYS_TO_KEEP -delete
        log "Removed test reports older than $DAYS_TO_KEEP days"
    fi
}

# Clean coverage reports
clean_coverage_reports() {
    log "Cleaning coverage reports..."
    
    if [ -d "$COVERAGE_DIR" ]; then
        find "$COVERAGE_DIR" -type f -mtime +$DAYS_TO_KEEP -delete
        log "Removed coverage reports older than $DAYS_TO_KEEP days"
    fi
}

# Clean virtual environment
clean_venv() {
    log "Cleaning virtual environment..."
    
    if [ -d "$VENV_DIR" ]; then
        deactivate 2>/dev/null || true
        rm -rf "$VENV_DIR"
        log "Removed virtual environment"
    fi
}

# Clean temporary files
clean_temp_files() {
    log "Cleaning temporary files..."
    
    if [ -d "$TEMP_DIR" ]; then
        find "$TEMP_DIR" -type f -delete
        log "Removed temporary files"
    fi
}

# Clean log files
clean_logs() {
    log "Cleaning log files..."
    
    if [ -d "$LOG_DIR" ]; then
        find "$LOG_DIR" -type f -mtime +$DAYS_TO_KEEP -delete
        log "Removed log files older than $DAYS_TO_KEEP days"
    fi
}

# Clean backup files
clean_backups() {
    log "Cleaning backup files..."
    
    if [ -d "$BACKUP_DIR" ]; then
        find "$BACKUP_DIR" -type f -mtime +$DAYS_TO_KEEP -delete
        log "Removed backup files older than $DAYS_TO_KEEP days"
    fi
}

# Clean test fixtures
clean_test_fixtures() {
    log "Cleaning test fixtures..."
    
    if [ -d "$TEST_DIR/fixtures" ]; then
        find "$TEST_DIR/fixtures" -type f -name "*.json" -mtime +$DAYS_TO_KEEP -delete
        log "Removed test fixtures older than $DAYS_TO_KEEP days"
    fi
}

# Clean Python cache files
clean_python_cache() {
    log "Cleaning Python cache files..."
    
    find . -type d -name "__pycache__" -exec rm -rf {} +
    find . -type f -name "*.pyc" -delete
    find . -type f -name "*.pyo" -delete
    find . -type f -name "*.pyd" -delete
    find . -type f -name ".coverage" -delete
    find . -type d -name "*.egg-info" -exec rm -rf {} +
    find . -type d -name "*.egg" -exec rm -rf {} +
    find . -type d -name ".pytest_cache" -exec rm -rf {} +
    find . -type d -name ".mypy_cache" -exec rm -rf {} +
    find . -type d -name ".coverage" -exec rm -rf {} +
    log "Removed Python cache files"
}

# Clean Docker resources
clean_docker() {
    log "Cleaning Docker resources..."
    
    # Remove stopped containers
    docker container prune -f
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes
    docker volume prune -f
    
    # Remove unused networks
    docker network prune -f
    
    log "Cleaned Docker resources"
}

# Clean Kubernetes resources
clean_kubernetes() {
    log "Cleaning Kubernetes resources..."
    
    # Remove test namespaces
    kubectl get namespace | grep "test-" | awk '{print $1}' | xargs -r kubectl delete namespace
    
    # Remove test pods
    kubectl get pods -A | grep "test-" | awk '{print $2}' | xargs -r kubectl delete pod
    
    # Remove test services
    kubectl get services -A | grep "test-" | awk '{print $2}' | xargs -r kubectl delete service
    
    log "Cleaned Kubernetes resources"
}

# Main function
main() {
    # Parse command line arguments
    local clean_all=false
    local clean_docker_resources=false
    local clean_k8s_resources=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --all)
                clean_all=true
                shift
                ;;
            --docker)
                clean_docker_resources=true
                shift
                ;;
            --kubernetes)
                clean_k8s_resources=true
                shift
                ;;
            *)
                shift
                ;;
        esac
    done
    
    # Clean test results
    clean_test_results
    
    # Clean coverage reports
    clean_coverage_reports
    
    # Clean virtual environment
    clean_venv
    
    # Clean temporary files
    clean_temp_files
    
    # Clean log files
    clean_logs
    
    # Clean backup files
    clean_backups
    
    # Clean test fixtures
    clean_test_fixtures
    
    # Clean Python cache files
    clean_python_cache
    
    # Clean Docker resources if requested
    if [ "$clean_all" = true ] || [ "$clean_docker_resources" = true ]; then
        clean_docker
    fi
    
    # Clean Kubernetes resources if requested
    if [ "$clean_all" = true ] || [ "$clean_k8s_resources" = true ]; then
        clean_kubernetes
    fi
    
    log "Cleanup completed successfully!"
}

# Run main function
main "$@" 