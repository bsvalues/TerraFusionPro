#!/bin/bash

set -e

echo "🚀 Starting TerraFusion Preview Environment..."

# Check Python version
python_version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
if (( $(echo "$python_version < 3.12" | bc -l) )); then
    echo "❌ Python 3.12 or higher is required"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt
pip install -r monitoring/requirements.txt
pip install flask

# Start the preview environment
echo "🌐 Starting preview environment..."
python scripts/preview.py &

# Wait for the API server to start
echo "⏳ Waiting for API server to start..."
sleep 5

# Open the dashboard in the default browser
echo "🌍 Opening dashboard..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:3000
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open http://localhost:3000
elif [[ "$OSTYPE" == "msys" ]]; then
    start http://localhost:3000
fi

echo "
✨ TerraFusion Preview Environment is running!

📊 Dashboard: http://localhost:3000
📈 API Server: http://localhost:5000

To stop the preview environment:
1. Press Ctrl+C in this terminal
2. Run 'pkill -f preview.py'

Enjoy exploring TerraFusion! 🚀
" 