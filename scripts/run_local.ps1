# Create virtual environment if it doesn't exist
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..."
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..."
.\venv\Scripts\Activate.ps1

# Install dependencies
Write-Host "Installing dependencies..."
pip install -r services/ai_service/requirements.txt
pip install -r services/data_service/requirements.txt
pip install -r services/monitoring_service/requirements.txt

# Start services in separate windows
Write-Host "Starting AI Service..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $PWD; .\venv\Scripts\Activate.ps1; python services/ai_service/main.py"

Write-Host "Starting Data Service..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $PWD; .\venv\Scripts\Activate.ps1; python services/data_service/main.py"

Write-Host "Starting Monitoring Service..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $PWD; .\venv\Scripts\Activate.ps1; python services/monitoring_service/main.py"

Write-Host "All services started successfully!"
Write-Host "AI Service: http://localhost:8000"
Write-Host "Data Service: http://localhost:8001"
Write-Host "Monitoring Service: http://localhost:8002" 