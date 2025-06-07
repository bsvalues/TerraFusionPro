# Create virtual environment if it doesn't exist
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..."
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..."
.\venv\Scripts\Activate.ps1

# Install test dependencies
Write-Host "Installing test dependencies..."
pip install pytest pytest-cov pytest-asyncio httpx

# Run tests for AI service
Write-Host "Running tests for AI service..."
pytest services/ai_service/tests --cov=services/ai_service --cov-report=term-missing

# Run tests for Data service
Write-Host "Running tests for Data service..."
pytest services/data_service/tests --cov=services/data_service --cov-report=term-missing

# Run tests for Monitoring service
Write-Host "Running tests for Monitoring service..."
pytest services/monitoring_service/tests --cov=services/monitoring_service --cov-report=term-missing

# Generate coverage report
Write-Host "Generating coverage report..."
coverage combine
coverage report
coverage html

Write-Host "Tests completed successfully!" 