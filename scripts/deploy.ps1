# Initialize Terraform
Write-Host "Initializing Terraform..."
terraform init

# Apply Terraform configuration
Write-Host "Applying Terraform configuration..."
terraform apply -auto-approve

# Get EKS cluster credentials
Write-Host "Getting EKS cluster credentials..."
aws eks update-kubeconfig --name terrafusion-cluster --region us-west-2

# Install Helm repositories
Write-Host "Adding Helm repositories..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add loki https://grafana.github.io/loki/charts
helm repo update

# Create monitoring namespace
Write-Host "Creating monitoring namespace..."
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

# Install Prometheus
Write-Host "Installing Prometheus..."
helm upgrade --install prometheus prometheus-community/kube-prometheus-stack `
  --namespace monitoring `
  --values k8s/monitoring/prometheus-values.yaml

# Install Grafana
Write-Host "Installing Grafana..."
helm upgrade --install grafana grafana/grafana `
  --namespace monitoring `
  --values k8s/monitoring/grafana-values.yaml

# Install Loki
Write-Host "Installing Loki..."
helm upgrade --install loki loki/loki-stack `
  --namespace monitoring `
  --values k8s/monitoring/loki-values.yaml

# Deploy TerraFusion services
Write-Host "Deploying TerraFusion services..."
kubectl apply -f k8s/

# Wait for services to be ready
Write-Host "Waiting for services to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/ai-service -n default
kubectl wait --for=condition=available --timeout=300s deployment/data-service -n default
kubectl wait --for=condition=available --timeout=300s deployment/monitoring-service -n default

Write-Host "Deployment completed successfully!" 