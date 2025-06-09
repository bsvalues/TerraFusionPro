# TerraFusion Enterprise Setup (Minimal Version)
# Copyright (c) 2024 TerraFusion Technologies

Write-Host "TerraFusion Setup - Minimal Version" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Function to check prerequisites
function Test-Prerequisites {
    Write-Host "`nChecking prerequisites..." -ForegroundColor Yellow
    
    $prerequisites = @{
        "Docker Desktop" = { Get-Command docker -ErrorAction SilentlyContinue }
        "Node.js" = { Get-Command node -ErrorAction SilentlyContinue }
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
        # Install setuptools first
        Write-Host "Installing setuptools..." -ForegroundColor Yellow
        python -m pip install --upgrade pip setuptools wheel
        
        # Create virtual environment if it doesn't exist
        if (-not (Test-Path "venv")) {
            Write-Host "Creating virtual environment..." -ForegroundColor Yellow
            python -m venv venv
        }
        
        # Activate virtual environment
        Write-Host "Activating virtual environment..." -ForegroundColor Yellow
        & ".\venv\Scripts\Activate.ps1"
        
        # Install core requirements
        Write-Host "Installing core requirements..." -ForegroundColor Yellow
        pip install fastapi==0.104.1 uvicorn==0.24.0 pydantic==2.4.2
        
        return $true
    }
    catch {
        Write-Host "Python environment setup failed: $_" -ForegroundColor Red
        return $false
    }
}

# Function to setup Docker services
function Setup-DockerServices {
    Write-Host "`nSetting up Docker services..." -ForegroundColor Yellow
    
    try {
        # Check if Docker is running
        $dockerRunning = docker info 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Docker is not running. Please start Docker Desktop first."
        }
        
        # Pull required images
        Write-Host "Pulling required Docker images..." -ForegroundColor Yellow
        docker pull redis:alpine
        docker pull postgres:latest
        
        # Create Docker network if it doesn't exist
        $networkExists = docker network ls --filter name=terrafusion --format "{{.Name}}"
        if (-not $networkExists) {
            Write-Host "Creating Docker network..." -ForegroundColor Yellow
            docker network create terrafusion
        }
        
        return $true
    }
    catch {
        Write-Host "Docker setup failed: $_" -ForegroundColor Red
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
        
        # Setup Docker services
        if (-not (Setup-DockerServices)) {
            throw "Docker services setup failed"
        }
        
        Write-Host "`nMinimal setup completed successfully!" -ForegroundColor Green
        Write-Host "`nNext steps:" -ForegroundColor Cyan
        Write-Host "1. Start Docker Desktop if not already running" -ForegroundColor White
        Write-Host "2. Run 'docker-compose up -d' to start services" -ForegroundColor White
        Write-Host "3. Run 'python -m uvicorn main:app --reload' to start the application" -ForegroundColor White
    }
    catch {
        Write-Host "`nSetup failed: $_" -ForegroundColor Red
        exit 1
    }
}

# Execute setup
Start-Setup 