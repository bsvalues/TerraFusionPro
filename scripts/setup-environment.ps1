# TerraFusion Environment Setup Script

Write-Host "🚀 Starting TerraFusion Environment Setup..." -ForegroundColor Green

# Check and install prerequisites
function Check-Prerequisites {
    Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow
    
    # Check Docker Desktop
    if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Docker Desktop not found. Please install Docker Desktop first." -ForegroundColor Red
        exit 1
    }
    
    # Check Node.js
    if (!(Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
        exit 1
    }
    
    # Check Yarn
    if (!(Get-Command yarn -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Yarn not found. Installing Yarn..." -ForegroundColor Yellow
        npm install -g yarn
    }
    
    # Check kubectl
    if (!(Get-Command kubectl -ErrorAction SilentlyContinue)) {
        Write-Host "❌ kubectl not found. Please install kubectl first." -ForegroundColor Red
        exit 1
    }
}

# Setup development environment
function Setup-DevelopmentEnvironment {
    Write-Host "🔧 Setting up development environment..." -ForegroundColor Yellow
    
    # Install dependencies
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    yarn install
    
    # Setup environment variables
    Write-Host "⚙️ Setting up environment variables..." -ForegroundColor Yellow
    if (!(Test-Path .env)) {
        Copy-Item .env.example .env
    }
    
    # Initialize git hooks
    Write-Host "🔨 Setting up git hooks..." -ForegroundColor Yellow
    yarn prepare
}

# Setup Docker environment
function Setup-DockerEnvironment {
    Write-Host "🐳 Setting up Docker environment..." -ForegroundColor Yellow
    
    # Start Docker containers
    Write-Host "🚀 Starting Docker containers..." -ForegroundColor Yellow
    docker-compose up -d
    
    # Wait for containers to be ready
    Write-Host "⏳ Waiting for containers to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
}

# Setup Kubernetes environment
function Setup-KubernetesEnvironment {
    Write-Host "☸️ Setting up Kubernetes environment..." -ForegroundColor Yellow
    
    # Apply Kubernetes configurations
    Write-Host "📝 Applying Kubernetes configurations..." -ForegroundColor Yellow
    kubectl apply -f k8s/
    
    # Setup monitoring
    Write-Host "📊 Setting up monitoring..." -ForegroundColor Yellow
    kubectl apply -f k8s/monitoring/
}

# Setup database
function Setup-Database {
    Write-Host "🗄️ Setting up database..." -ForegroundColor Yellow
    
    # Run migrations
    Write-Host "📝 Running database migrations..." -ForegroundColor Yellow
    yarn db:migrate
    
    # Seed database
    Write-Host "🌱 Seeding database..." -ForegroundColor Yellow
    yarn db:seed
}

# Main execution
try {
    # Check prerequisites
    Check-Prerequisites
    
    # Setup development environment
    Setup-DevelopmentEnvironment
    
    # Setup Docker environment
    Setup-DockerEnvironment
    
    # Setup Kubernetes environment
    Setup-KubernetesEnvironment
    
    # Setup database
    Setup-Database
    
    Write-Host "✅ Environment setup completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Error during setup: $_" -ForegroundColor Red
    exit 1
} 