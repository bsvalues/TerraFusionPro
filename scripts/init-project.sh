#!/bin/bash

echo "🚀 Initializing TerraFusion Project..."

# Create necessary directories
mkdir -p {frontend,backend,mobile,ai,infrastructure,docs,tests}

# Initialize Git repository
git init
git add .
git commit -m "Initial project structure"

# Install dependencies
echo "📦 Installing dependencies..."
yarn install

# Setup environment
echo "🔧 Setting up environment..."
cp .env.example .env

# Initialize Docker
echo "🐳 Initializing Docker..."
docker-compose up -d

# Setup database
echo "🗄️ Setting up database..."
yarn db:migrate
yarn db:seed

# Initialize Kubernetes
echo "☸️ Initializing Kubernetes..."
kubectl apply -f k8s/

# Setup monitoring
echo "📊 Setting up monitoring..."
kubectl apply -f k8s/monitoring/

# Initialize documentation
echo "📚 Initializing documentation..."
yarn docs:generate

echo "✅ Project initialization complete!" 