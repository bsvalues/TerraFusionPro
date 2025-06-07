# TerraFusion Master Setup Script

Write-Host "🚀 Starting TerraFusion Master Setup..." -ForegroundColor Green

# Function to check if running as administrator
function Test-Administrator {
    $currentUser = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentUser.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Check if running as administrator
if (-not (Test-Administrator)) {
    Write-Host "❌ This script requires administrator privileges. Please run as administrator." -ForegroundColor Red
    exit 1
}

# Function to execute setup scripts
function Invoke-SetupScript {
    param (
        [string]$ScriptPath,
        [string]$ScriptName
    )
    
    Write-Host "📜 Executing $ScriptName..." -ForegroundColor Yellow
    try {
        & "$ScriptPath"
        if ($LASTEXITCODE -ne 0) {
            throw "Script failed with exit code $LASTEXITCODE"
        }
    } catch {
        Write-Host "❌ Error executing $ScriptName: $_" -ForegroundColor Red
        exit 1
    }
}

# Main execution
try {
    # Execute environment setup
    Invoke-SetupScript -ScriptPath ".\scripts\setup-environment.ps1" -ScriptName "Environment Setup"
    
    # Execute infrastructure setup
    Invoke-SetupScript -ScriptPath ".\scripts\setup-infrastructure.ps1" -ScriptName "Infrastructure Setup"
    
    Write-Host "✅ TerraFusion setup completed successfully!" -ForegroundColor Green
    Write-Host "🎉 You can now start developing TerraFusion!" -ForegroundColor Green
} catch {
    Write-Host "❌ Error during setup: $_" -ForegroundColor Red
    exit 1
} 