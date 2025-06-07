# TerraFusion Enterprise Deployment Script

# Check system requirements
Write-Host "Checking system requirements..."
$cpuCores = (Get-WmiObject -Class Win32_Processor).NumberOfCores
$totalRAM = (Get-WmiObject -Class Win32_ComputerSystem).TotalPhysicalMemory / 1GB
$gpu = Get-WmiObject -Class Win32_VideoController | Select-Object -ExpandProperty Name

if ($cpuCores -lt 8) {
    Write-Error "Insufficient CPU cores. Required: 8+, Found: $cpuCores"
    exit 1
}

if ($totalRAM -lt 32) {
    Write-Error "Insufficient RAM. Required: 32GB+, Found: $totalRAM GB"
    exit 1
}

if (-not ($gpu -match "NVIDIA")) {
    Write-Warning "NVIDIA GPU not detected. LLM performance may be limited."
}

# Create virtual environment
Write-Host "Creating virtual environment..."
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
Write-Host "Installing dependencies..."
pip install -r requirements.txt

# Create necessary directories
Write-Host "Creating directory structure..."
$directories = @(
    "data",
    "models",
    "logs",
    "config",
    "backups"
)

foreach ($dir in $directories) {
    New-Item -ItemType Directory -Force -Path $dir
}

# Initialize LLM
Write-Host "Initializing LLM..."
python enterprise/llm/init_llm.py

# Deploy AI agents
Write-Host "Deploying AI agents..."
python enterprise/agents/deploy_agents.py

# Start Redis (required for agent communication)
Write-Host "Starting Redis..."
Start-Process redis-server

# Launch GUI
Write-Host "Launching TerraFusion Enterprise GUI..."
python enterprise/gui/main.py

# Display status
Write-Host "`nTerraFusion Enterprise Deployment Complete!"
Write-Host "The GUI application should now be running."
Write-Host "`nDefault credentials:"
Write-Host "Username: admin"
Write-Host "Password: changeme"
Write-Host "`nPlease change the default password immediately!" 