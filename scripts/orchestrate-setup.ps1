# TerraFusion Complete Setup Orchestration

Write-Host "🚀 Starting TerraFusion Complete Setup Orchestration..." -ForegroundColor Green

# Function to check if running as administrator
function Test-Administrator {
    $currentUser = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentUser.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Check if running as administrator
if (-not (Test-Administrator)) {
    Write-Host "This script requires administrator privileges. Please run as administrator." -ForegroundColor Red
    exit 1
}

# Function to execute a script and check its status
function Invoke-Script {
    param (
        [string]$ScriptPath,
        [string]$ScriptName,
        [string]$ScriptType = "ps1"
    )
    
    Write-Host "Executing $ScriptName..." -ForegroundColor Yellow
    try {
        if ($ScriptType -eq "ps1") {
            & $ScriptPath
        } elseif ($ScriptType -eq "sh") {
            bash $ScriptPath
        } elseif ($ScriptType -eq "py") {
            python $ScriptPath
        }
        
        if ($LASTEXITCODE -ne 0) {
            throw "Script failed with exit code $LASTEXITCODE"
        }
        Write-Host "✅ $ScriptName completed successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error executing $ScriptName: $_" -ForegroundColor Red
        exit 1
    }
}

# Main execution
try {
    # Phase 1: Primary Setup
    Write-Host "`n📦 Phase 1: Primary Setup" -ForegroundColor Cyan
    Invoke-Script -ScriptPath ".\scripts\setup.ps1" -ScriptName "Master Setup"
    
    # Phase 2: Secondary Setup
    Write-Host "`n🔧 Phase 2: Secondary Setup" -ForegroundColor Cyan
    Invoke-Script -ScriptPath ".\scripts\init-project.sh" -ScriptName "Project Initialization" -ScriptType "sh"
    Invoke-Script -ScriptPath ".\scripts\run-migrations.sh" -ScriptName "Database Setup" -ScriptType "sh"
    Invoke-Script -ScriptPath ".\scripts\setup_monitoring.py" -ScriptName "Monitoring Setup" -ScriptType "py"
    
    # Phase 3: Service Management
    Write-Host "`n🚀 Phase 3: Service Management" -ForegroundColor Cyan
    Invoke-Script -ScriptPath ".\scripts\run_services.ps1" -ScriptName "Service Startup"
    Invoke-Script -ScriptPath ".\scripts\deploy_k8s.ps1" -ScriptName "Kubernetes Deployment"
    
    # Phase 4: Verification
    Write-Host "`n✅ Phase 4: Verification" -ForegroundColor Cyan
    Invoke-Script -ScriptPath ".\scripts\health-check.sh" -ScriptName "Health Check" -ScriptType "sh"
    Invoke-Script -ScriptPath ".\scripts\verify-metrics.sh" -ScriptName "Metrics Verification" -ScriptType "sh"
    Invoke-Script -ScriptPath ".\scripts\check-logs.sh" -ScriptName "Log Verification" -ScriptType "sh"
    
    Write-Host "`n🎉 TerraFusion setup completed successfully!" -ForegroundColor Green
    Write-Host "You can now start developing TerraFusion!" -ForegroundColor Green
} catch {
    Write-Host "❌ Error during setup: $_" -ForegroundColor Red
    exit 1
} 