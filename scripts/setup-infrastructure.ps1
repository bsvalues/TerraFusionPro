# TerraFusion Infrastructure Setup Script

Write-Host "🏗️ Starting TerraFusion Infrastructure Setup..." -ForegroundColor Green

# Setup security configurations
function Setup-Security {
    Write-Host "🔒 Setting up security configurations..." -ForegroundColor Yellow
    
    # Setup SSL certificates
    Write-Host "📜 Setting up SSL certificates..." -ForegroundColor Yellow
    if (!(Test-Path ./certs)) {
        New-Item -ItemType Directory -Path ./certs
    }
    
    # Configure firewall rules
    Write-Host "🛡️ Configuring firewall rules..." -ForegroundColor Yellow
    New-NetFirewallRule -DisplayName "TerraFusion API" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
    New-NetFirewallRule -DisplayName "TerraFusion Frontend" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
}

# Setup monitoring and logging
function Setup-Monitoring {
    Write-Host "📊 Setting up monitoring and logging..." -ForegroundColor Yellow
    
    # Setup Prometheus
    Write-Host "📈 Setting up Prometheus..." -ForegroundColor Yellow
    kubectl apply -f k8s/monitoring/prometheus/
    
    # Setup Grafana
    Write-Host "📊 Setting up Grafana..." -ForegroundColor Yellow
    kubectl apply -f k8s/monitoring/grafana/
    
    # Setup ELK Stack
    Write-Host "📝 Setting up ELK Stack..." -ForegroundColor Yellow
    kubectl apply -f k8s/monitoring/elk/
}

# Setup backup and recovery
function Setup-Backup {
    Write-Host "💾 Setting up backup and recovery..." -ForegroundColor Yellow
    
    # Create backup directory
    Write-Host "📁 Creating backup directory..." -ForegroundColor Yellow
    if (!(Test-Path ./backups)) {
        New-Item -ItemType Directory -Path ./backups
    }
    
    # Setup database backup
    Write-Host "🗄️ Setting up database backup..." -ForegroundColor Yellow
    $backupScript = @"
pg_dump -U postgres -d terrafusion > ./backups/db_backup_\$(Get-Date -Format 'yyyyMMdd_HHmmss').sql
"@
    Set-Content -Path ./scripts/backup-db.ps1 -Value $backupScript
}

# Setup CI/CD pipeline
function Setup-CICD {
    Write-Host "🔄 Setting up CI/CD pipeline..." -ForegroundColor Yellow
    
    # Setup GitHub Actions
    Write-Host "⚙️ Setting up GitHub Actions..." -ForegroundColor Yellow
    if (!(Test-Path ./.github/workflows)) {
        New-Item -ItemType Directory -Path ./.github/workflows -Force
    }
    
    # Create main workflow
    $workflowContent = @"
name: TerraFusion CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
    - name: Install dependencies
      run: yarn install
    - name: Run tests
      run: yarn test
    - name: Build
      run: yarn build
"@
    Set-Content -Path ./.github/workflows/main.yml -Value $workflowContent
}

# Main execution
try {
    # Setup security
    Setup-Security
    
    # Setup monitoring
    Setup-Monitoring
    
    # Setup backup
    Setup-Backup
    
    # Setup CI/CD
    Setup-CICD
    
    Write-Host "✅ Infrastructure setup completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Error during setup: $_" -ForegroundColor Red
    exit 1
} 