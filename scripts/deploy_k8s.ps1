# Get EKS cluster credentials
Write-Host "Getting EKS cluster credentials..."
aws eks update-kubeconfig --name terrafusion-cluster --region us-west-2

# Create namespace if it doesn't exist
Write-Host "Creating namespace..."
kubectl create namespace terrafusion --dry-run=client -o yaml | kubectl apply -f -

# Create secrets
Write-Host "Creating secrets..."
kubectl create secret generic aws-credentials `
    --namespace terrafusion `
    --from-literal=AWS_ACCESS_KEY_ID=$env:AWS_ACCESS_KEY_ID `
    --from-literal=AWS_SECRET_ACCESS_KEY=$env:AWS_SECRET_ACCESS_KEY `
    --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic grafana-admin-credentials `
    --namespace terrafusion `
    --from-literal=admin-user=admin `
    --from-literal=admin-password=$env:GRAFANA_ADMIN_PASSWORD `
    --dry-run=client -o yaml | kubectl apply -f -

# Deploy monitoring stack
Write-Host "Deploying monitoring stack..."
helm upgrade --install prometheus prometheus-community/kube-prometheus-stack `
    --namespace terrafusion `
    --values k8s/monitoring/prometheus-values.yaml

helm upgrade --install grafana grafana/grafana `
    --namespace terrafusion `
    --values k8s/monitoring/grafana-values.yaml

helm upgrade --install loki loki/loki-stack `
    --namespace terrafusion `
    --values k8s/monitoring/loki-values.yaml

# Deploy TerraFusion services
Write-Host "Deploying TerraFusion services..."
kubectl apply -f k8s/

# Wait for services to be ready
Write-Host "Waiting for services to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/ai-service -n terrafusion
kubectl wait --for=condition=available --timeout=300s deployment/data-service -n terrafusion
kubectl wait --for=condition=available --timeout=300s deployment/monitoring-service -n terrafusion

# Get service URLs
Write-Host "Getting service URLs..."
$ai_service_url = kubectl get service ai-service -n terrafusion -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
$data_service_url = kubectl get service data-service -n terrafusion -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
$monitoring_service_url = kubectl get service monitoring-service -n terrafusion -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

Write-Host "Deployment completed successfully!"
Write-Host "AI Service: http://$ai_service_url"
Write-Host "Data Service: http://$data_service_url"
Write-Host "Monitoring Service: http://$monitoring_service_url" 