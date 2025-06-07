#!/bin/bash

# TerraFusionPro Test Runner Script

# Configuration
ENVIRONMENT=${1:-"unit"}
TEST_TYPE=${2:-"all"}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/terrafusionpro/test_run_${TIMESTAMP}.log"
ERROR_LOG="/var/log/terrafusionpro/test_run_${TIMESTAMP}_error.log"
CONFIG_FILE="tests/test_config.yml"

# Logging function
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
handle_error() {
  log "ERROR: $1"
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$ERROR_LOG"
  exit 1
}

# Load configuration
load_config() {
  log "Loading test configuration..."
  if [ ! -f "$CONFIG_FILE" ]; then
    handle_error "Test configuration file not found: $CONFIG_FILE"
  fi
  
  # Parse YAML using Python
  CONFIG=$(python3 -c "
import yaml
with open('$CONFIG_FILE', 'r') as f:
    print(yaml.safe_load(f))
")
  
  log "Configuration loaded successfully"
}

# Setup test environment
setup_environment() {
  log "Setting up $ENVIRONMENT environment..."
  
  case $ENVIRONMENT in
    "unit")
      # Setup local environment
      python3 -m venv .venv
      source .venv/bin/activate
      pip install -r requirements-test.txt
      ;;
    "integration")
      # Setup Docker environment
      docker-compose -f docker-compose.test.yml up -d
      ;;
    "performance")
      # Setup Kubernetes environment
      kubectl apply -f k8s/test-environment.yaml
      ;;
    *)
      handle_error "Invalid environment: $ENVIRONMENT"
      ;;
  esac
  
  log "Environment setup completed"
}

# Run unit tests
run_unit_tests() {
  log "Running unit tests..."
  
  # Run pytest with coverage
  pytest tests/unit \
    --cov=src \
    --cov-report=term-missing \
    --cov-report=html \
    --junitxml=reports/unit-tests.xml \
    --html=reports/unit-tests.html \
    -v
  
  if [ $? -ne 0 ]; then
    handle_error "Unit tests failed"
  fi
  
  log "Unit tests completed successfully"
}

# Run integration tests
run_integration_tests() {
  log "Running integration tests..."
  
  # Run integration tests
  pytest tests/integration \
    --junitxml=reports/integration-tests.xml \
    --html=reports/integration-tests.html \
    -v
  
  if [ $? -ne 0 ]; then
    handle_error "Integration tests failed"
  fi
  
  log "Integration tests completed successfully"
}

# Run performance tests
run_performance_tests() {
  log "Running performance tests..."
  
  # Run Locust load tests
  locust -f tests/performance/locustfile.py \
    --host=http://localhost:8000 \
    --users 100 \
    --spawn-rate 10 \
    --run-time 5m \
    --headless \
    --html=reports/performance-tests.html
  
  if [ $? -ne 0 ]; then
    handle_error "Performance tests failed"
  fi
  
  log "Performance tests completed successfully"
}

# Run security tests
run_security_tests() {
  log "Running security tests..."
  
  # Run SAST
  bandit -r src -f json -o reports/security-sast.json
  
  # Run dependency scan
  safety check -r requirements.txt --json > reports/security-dependencies.json
  
  # Run container scan
  trivy image terrafusionpro:latest -f json -o reports/security-container.json
  
  log "Security tests completed successfully"
}

# Generate test report
generate_report() {
  log "Generating test report..."
  
  # Combine test results
  python3 scripts/generate_report.py \
    --unit-reports reports/unit-tests.xml \
    --integration-reports reports/integration-tests.xml \
    --performance-reports reports/performance-tests.html \
    --security-reports reports/security-*.json \
    --output reports/test-report.html
  
  # Upload report to S3
  aws s3 cp reports/test-report.html \
    s3://terrafusionpro-test-reports/reports/test-report-${TIMESTAMP}.html
  
  log "Test report generated and uploaded"
}

# Send notifications
send_notifications() {
  log "Sending notifications..."
  
  # Send Slack notification
  curl -X POST -H 'Content-type: application/json' \
    --data "{
      \"channel\": \"#test-results\",
      \"text\": \"Test run completed for $ENVIRONMENT environment. Report: https://terrafusionpro-test-reports.s3.amazonaws.com/reports/test-report-${TIMESTAMP}.html\"
    }" \
    $SLACK_WEBHOOK_URL
  
  # Send email notification
  aws ses send-email \
    --from "qa-team@terrafusionpro.com" \
    --destination "ToAddresses=dev-team@terrafusionpro.com" \
    --message "Subject={Data=Test Run Results},Body={Text={Data=Test run completed. Check the report for details.}}"
  
  log "Notifications sent"
}

# Cleanup
cleanup() {
  log "Cleaning up..."
  
  case $ENVIRONMENT in
    "unit")
      deactivate
      ;;
    "integration")
      docker-compose -f docker-compose.test.yml down
      ;;
    "performance")
      kubectl delete -f k8s/test-environment.yaml
      ;;
  esac
  
  log "Cleanup completed"
}

# Main test execution
main() {
  log "Starting test run for environment: $ENVIRONMENT"
  
  # Create log directories
  mkdir -p "$(dirname "$LOG_FILE")"
  mkdir -p "$(dirname "$ERROR_LOG")"
  
  # Execute test pipeline
  load_config
  setup_environment
  
  case $TEST_TYPE in
    "unit")
      run_unit_tests
      ;;
    "integration")
      run_integration_tests
      ;;
    "performance")
      run_performance_tests
      ;;
    "security")
      run_security_tests
      ;;
    "all")
      run_unit_tests
      run_integration_tests
      run_performance_tests
      run_security_tests
      ;;
    *)
      handle_error "Invalid test type: $TEST_TYPE"
      ;;
  esac
  
  generate_report
  send_notifications
  cleanup
  
  log "Test run completed successfully"
}

# Execute main process
main 