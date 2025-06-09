# Docker Desktop Starter
# Copyright (c) 2024 TerraFusion Technologies

Write-Host "Checking Docker Desktop status..." -ForegroundColor Yellow

# Check if Docker Desktop is installed
$dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
if (-not (Test-Path $dockerPath)) {
    Write-Host "Docker Desktop is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

# Check if Docker Desktop is running
$dockerRunning = docker info 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Docker Desktop is already running." -ForegroundColor Green
    exit 0
}

# Start Docker Desktop
Write-Host "Starting Docker Desktop..." -ForegroundColor Yellow
Start-Process $dockerPath

# Wait for Docker to start
Write-Host "Waiting for Docker to start..." -ForegroundColor Yellow
$timeout = 120  # 2 minutes timeout
$elapsed = 0
$interval = 5   # Check every 5 seconds

while ($elapsed -lt $timeout) {
    $dockerRunning = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Docker Desktop is now running." -ForegroundColor Green
        exit 0
    }
    Start-Sleep -Seconds $interval
    $elapsed += $interval
    Write-Host "Still waiting... ($elapsed seconds)" -ForegroundColor Yellow
}

Write-Host "Docker Desktop failed to start within the timeout period." -ForegroundColor Red
exit 1 