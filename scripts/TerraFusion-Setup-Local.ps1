# TerraFusion Enterprise Setup (Local, No Docker)
# Copyright (c) 2024 TerraFusion Technologies

Write-Host "TerraFusion Setup - Local (No Docker)" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Function to check prerequisites
function Test-Prerequisites {
    Write-Host "`nChecking prerequisites..." -ForegroundColor Yellow
    $prerequisites = @{
        "Node.js" = { Get-Command node -ErrorAction SilentlyContinue }
        "Python" = { Get-Command python -ErrorAction SilentlyContinue }
        "PostgreSQL" = { Get-Service -Name postgresql* -ErrorAction SilentlyContinue }
        "Redis" = { Get-Service -Name redis* -ErrorAction SilentlyContinue }
    }
    $allPresent = $true
    foreach ($prereq in $prerequisites.GetEnumerator()) {
        if (-not (& $prereq.Value)) {
            Write-Host "Missing or not running: $($prereq.Key)" -ForegroundColor Red
            $allPresent = $false
        } else {
            Write-Host "Found and running: $($prereq.Key)" -ForegroundColor Green
        }
    }
    return $allPresent
}

# Function to setup Python environment
function Setup-PythonEnvironment {
    Write-Host "`nSetting up Python environment..." -ForegroundColor Yellow
    try {
        python -m pip install --upgrade pip setuptools wheel
        if (-not (Test-Path "venv")) {
            Write-Host "Creating virtual environment..." -ForegroundColor Yellow
            python -m venv venv
        }
        Write-Host "Activating virtual environment..." -ForegroundColor Yellow
        & ".\venv\Scripts\Activate.ps1"
        Write-Host "Installing core requirements..." -ForegroundColor Yellow
        pip install -r requirements.txt
        return $true
    } catch {
        Write-Host "Python environment setup failed: $_" -ForegroundColor Red
        return $false
    }
}

# Function to setup Node.js environment
function Setup-NodeEnvironment {
    Write-Host "`nSetting up Node.js environment..." -ForegroundColor Yellow
    try {
        if (Test-Path "package.json") {
            Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
            npm install
        }
        return $true
    } catch {
        Write-Host "Node.js environment setup failed: $_" -ForegroundColor Red
        return $false
    }
}

# Main setup function
function Start-Setup {
    try {
        if (-not (Test-Prerequisites)) {
            Write-Host "`nPlease ensure PostgreSQL and Redis are installed and running locally." -ForegroundColor Red
            Write-Host "- PostgreSQL: https://www.postgresql.org/download/windows/" -ForegroundColor White
            Write-Host "- Redis (Memurai for Windows): https://www.memurai.com/" -ForegroundColor White
            exit 1
        }
        if (-not (Setup-PythonEnvironment)) {
            throw "Python environment setup failed"
        }
        if (-not (Setup-NodeEnvironment)) {
            throw "Node.js environment setup failed"
        }
        Write-Host "`nLocal setup completed successfully!" -ForegroundColor Green
        Write-Host "`nNext steps:" -ForegroundColor Cyan
        Write-Host "1. Ensure PostgreSQL and Redis are running locally." -ForegroundColor White
        Write-Host "2. Run 'python -m uvicorn main:app --reload' to start the application." -ForegroundColor White
        Write-Host "3. Run 'npm start' or 'yarn start' for frontend (if applicable)." -ForegroundColor White
    } catch {
        Write-Host "`nSetup failed: $_" -ForegroundColor Red
        exit 1
    }
}

# Execute setup
Start-Setup 