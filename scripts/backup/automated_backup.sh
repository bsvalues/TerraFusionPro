#!/bin/bash

# TerraFusionPro Enterprise Backup Script
# Version: 1.0.0
# Author: TerraFusionPro Team

# Configuration
BACKUP_ROOT="/backup/terrafusionpro"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30
LOG_FILE="/var/log/terrafusionpro/backup.log"
ERROR_LOG="/var/log/terrafusionpro/backup_error.log"

# Database configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="terrafusionpro"
DB_USER="backup_user"

# S3 configuration
S3_BUCKET="terrafusionpro-backups"
S3_REGION="us-east-1"

# Create backup directories
mkdir -p "$BACKUP_ROOT/database"
mkdir -p "$BACKUP_ROOT/files"
mkdir -p "$BACKUP_ROOT/configs"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

error_log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - ERROR: $1" >> "$ERROR_LOG"
}

# Database backup
backup_database() {
    log "Starting database backup..."
    local backup_file="$BACKUP_ROOT/database/db_backup_$TIMESTAMP.sql"
    
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$backup_file"; then
        log "Database backup completed successfully"
        gzip "$backup_file"
        aws s3 cp "$backup_file.gz" "s3://$S3_BUCKET/database/" --region "$S3_REGION"
    else
        error_log "Database backup failed"
        return 1
    fi
}

# File system backup
backup_files() {
    log "Starting file system backup..."
    local backup_file="$BACKUP_ROOT/files/files_backup_$TIMESTAMP.tar.gz"
    
    if tar -czf "$backup_file" /var/www/terrafusionpro; then
        log "File system backup completed successfully"
        aws s3 cp "$backup_file" "s3://$S3_BUCKET/files/" --region "$S3_REGION"
    else
        error_log "File system backup failed"
        return 1
    fi
}

# Configuration backup
backup_configs() {
    log "Starting configuration backup..."
    local backup_file="$BACKUP_ROOT/configs/configs_backup_$TIMESTAMP.tar.gz"
    
    if tar -czf "$backup_file" /etc/terrafusionpro; then
        log "Configuration backup completed successfully"
        aws s3 cp "$backup_file" "s3://$S3_BUCKET/configs/" --region "$S3_REGION"
    else
        error_log "Configuration backup failed"
        return 1
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old backups..."
    find "$BACKUP_ROOT" -type f -mtime +$RETENTION_DAYS -delete
    aws s3 ls "s3://$S3_BUCKET/" --region "$S3_REGION" | while read -r line; do
        createDate=$(echo "$line" | awk {'print $1" "$2'})
        createDate=$(date -d "$createDate" +%s)
        olderThan=$(date -d "-$RETENTION_DAYS days" +%s)
        if [[ $createDate -lt $olderThan ]]; then
            fileName=$(echo "$line" | awk {'print $4'})
            aws s3 rm "s3://$S3_BUCKET/$fileName" --region "$S3_REGION"
        fi
    done
}

# Verify backup integrity
verify_backup() {
    log "Verifying backup integrity..."
    local backup_file="$BACKUP_ROOT/database/db_backup_$TIMESTAMP.sql.gz"
    
    if gunzip -t "$backup_file"; then
        log "Backup verification successful"
        return 0
    else
        error_log "Backup verification failed"
        return 1
    fi
}

# Main backup process
main() {
    log "Starting TerraFusionPro backup process..."
    
    # Create backup directories if they don't exist
    mkdir -p "$(dirname "$LOG_FILE")"
    mkdir -p "$(dirname "$ERROR_LOG")"
    
    # Run backup procedures
    backup_database
    backup_files
    backup_configs
    
    # Verify backups
    verify_backup
    
    # Cleanup old backups
    cleanup_old_backups
    
    log "Backup process completed"
}

# Error handling
set -e
trap 'error_log "Backup process failed at line $LINENO"' ERR

# Run main process
main 