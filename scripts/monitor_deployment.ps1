# Get EKS cluster credentials
Write-Host "Getting EKS cluster credentials..."
aws eks update-kubeconfig --name terrafusion-cluster --region us-west-2

# Monitor pods
Write-Host "Monitoring pods..."
kubectl get pods -n terrafusion -w

# Monitor services
Write-Host "Monitoring services..."
kubectl get services -n terrafusion

# Monitor deployments
Write-Host "Monitoring deployments..."
kubectl get deployments -n terrafusion

# Check logs
Write-Host "Checking logs..."
Write-Host "AI Service logs:"
kubectl logs -f deployment/ai-service -n terrafusion

Write-Host "Data Service logs:"
kubectl logs -f deployment/data-service -n terrafusion

Write-Host "Monitoring Service logs:"
kubectl logs -f deployment/monitoring-service -n terrafusion

# Check metrics
Write-Host "Checking metrics..."
kubectl top pods -n terrafusion
kubectl top nodes

# Check events
Write-Host "Checking events..."
kubectl get events -n terrafusion --sort-by='.lastTimestamp'

Write-Host "Monitoring completed!" 