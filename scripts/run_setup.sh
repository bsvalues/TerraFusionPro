#!/bin/bash

set -e

echo "Starting TerraFusionPro monitoring setup..."

# Check Python version
python_version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
if [[ $(echo "$python_version < 3.12" | bc) -eq 1 ]]; then
    echo "Error: Python 3.12 or higher is required"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
pip install -r monitoring/requirements.txt

# Run setup script
echo "Running setup script..."
python scripts/setup_monitoring.py

# Start monitoring system
echo "Starting monitoring system..."
python monitoring/monitoring_system.py &

# Start containers
echo "Starting containers..."
docker-compose up -d

echo "Setup completed successfully!"
echo "You can now access:"
echo "- Prometheus: http://localhost:9090"
echo "- Grafana: http://localhost:3000"
echo "- Monitoring system: http://localhost:8000" 