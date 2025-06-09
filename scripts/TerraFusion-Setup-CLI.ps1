# TerraFusion Enterprise Setup (CLI Version)
# Copyright (c) 2024 TerraFusion Technologies

Write-Host "TerraFusion Setup - CLI Version" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# Function to check prerequisites
function Test-Prerequisites {
    Write-Host "`nChecking prerequisites..." -ForegroundColor Yellow
    
    $prerequisites = @{
        "Docker Desktop" = { Get-Command docker -ErrorAction SilentlyContinue }
        "Node.js" = { Get-Command node -ErrorAction SilentlyContinue }
        "Yarn" = { Get-Command yarn -ErrorAction SilentlyContinue }
        "kubectl" = { Get-Command kubectl -ErrorAction SilentlyContinue }
        "Python" = { Get-Command python -ErrorAction SilentlyContinue }
    }
    
    $allPresent = $true
    foreach ($prereq in $prerequisites.GetEnumerator()) {
        if (-not (& $prereq.Value)) {
            Write-Host "Missing: $($prereq.Key)" -ForegroundColor Red
            $allPresent = $false
        } else {
            Write-Host "Found: $($prereq.Key)" -ForegroundColor Green
        }
    }
    return $allPresent
}

# Function to setup Python environment
function Setup-PythonEnvironment {
    Write-Host "`nSetting up Python environment..." -ForegroundColor Yellow
    
    try {
        # Create virtual environment if it doesn't exist
        if (-not (Test-Path "venv")) {
            Write-Host "Creating virtual environment..." -ForegroundColor Yellow
            python -m venv venv
        }
        
        # Activate virtual environment
        Write-Host "Activating virtual environment..." -ForegroundColor Yellow
        & ".\venv\Scripts\Activate.ps1"
        
        # Upgrade pip
        Write-Host "Upgrading pip..." -ForegroundColor Yellow
        python -m pip install --upgrade pip
        
        # Install requirements
        if (Test-Path "requirements.txt") {
            Write-Host "Installing requirements..." -ForegroundColor Yellow
            pip install -r requirements.txt
        }
        
        return $true
    }
    catch {
        Write-Host "Python environment setup failed: $_" -ForegroundColor Red
        return $false
    }
}

# Main setup function
function Start-Setup {
    try {
        # Check prerequisites
        if (-not (Test-Prerequisites)) {
            throw "Prerequisites check failed"
        }
        
        # Setup Python environment
        if (-not (Setup-PythonEnvironment)) {
            throw "Python environment setup failed"
        }
        
        # Setup environment
        Write-Host "`nSetting up environment..." -ForegroundColor Yellow
        & ".\scripts\setup.ps1"
        
        # Configure project
        Write-Host "`nConfiguring project..." -ForegroundColor Yellow
        & ".\scripts\init-project.sh"
        & ".\scripts\run-migrations.sh"
        
        # Start services
        Write-Host "`nStarting services..." -ForegroundColor Yellow
        & ".\scripts\run_services.ps1"
        & ".\scripts\deploy_k8s.ps1"
        
        # Verify setup
        Write-Host "`nVerifying setup..." -ForegroundColor Yellow
        & ".\scripts\health-check.sh"
        
        Write-Host "`nSetup completed successfully!" -ForegroundColor Green
    }
    catch {
        Write-Host "`nSetup failed: $_" -ForegroundColor Red
        exit 1
    }
}

# Execute setup
Start-Setup 