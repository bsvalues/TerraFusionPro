#!/bin/bash

# Configuration
TEST_DIR="tests"
REPORT_DIR="test-results"
COVERAGE_DIR="coverage"
VENV_DIR=".venv"
PYTHON_VERSION="3.12"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging function
log() {
    echo -e "${2:-$GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Error handling
handle_error() {
    log "Error: $1" "$RED"
    exit 1
}

# Check Python version
check_python_version() {
    log "Checking Python version..."
    if ! command -v python$PYTHON_VERSION &> /dev/null; then
        handle_error "Python $PYTHON_VERSION is not installed"
    fi
}

# Create virtual environment
create_venv() {
    log "Creating virtual environment..."
    python$PYTHON_VERSION -m venv $VENV_DIR || handle_error "Failed to create virtual environment"
    source $VENV_DIR/bin/activate || handle_error "Failed to activate virtual environment"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    pip install --upgrade pip || handle_error "Failed to upgrade pip"
    pip install -r $TEST_DIR/requirements.txt || handle_error "Failed to install dependencies"
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    mkdir -p $REPORT_DIR $COVERAGE_DIR || handle_error "Failed to create directories"
}

# Run linting
run_linting() {
    log "Running linting..."
    
    # Run black
    log "Running black..." "$YELLOW"
    black $TEST_DIR || handle_error "Black check failed"
    
    # Run flake8
    log "Running flake8..." "$YELLOW"
    flake8 $TEST_DIR || handle_error "Flake8 check failed"
    
    # Run mypy
    log "Running mypy..." "$YELLOW"
    mypy $TEST_DIR || handle_error "Mypy check failed"
    
    # Run pylint
    log "Running pylint..." "$YELLOW"
    pylint $TEST_DIR || handle_error "Pylint check failed"
}

# Run security checks
run_security_checks() {
    log "Running security checks..."
    
    # Run bandit
    log "Running bandit..." "$YELLOW"
    bandit -r $TEST_DIR || handle_error "Bandit check failed"
    
    # Run safety
    log "Running safety..." "$YELLOW"
    safety check || handle_error "Safety check failed"
}

# Run tests
run_tests() {
    local test_type=$1
    local markers=$2
    
    log "Running $test_type tests..."
    
    # Run pytest with specified markers
    pytest $TEST_DIR \
        -m "$markers" \
        --junitxml=$REPORT_DIR/junit_${test_type}.xml \
        --html=$REPORT_DIR/report_${test_type}.html \
        --self-contained-html \
        --cov=src \
        --cov-report=term-missing \
        --cov-report=html:$COVERAGE_DIR/${test_type} \
        --cov-report=xml:$COVERAGE_DIR/${test_type}.xml || handle_error "Tests failed"
}

# Generate test data
generate_test_data() {
    log "Generating test data..."
    python $TEST_DIR/fixtures/fixture_generator.py || handle_error "Failed to generate test data"
}

# Main function
main() {
    # Parse command line arguments
    local test_type="all"
    while [[ $# -gt 0 ]]; do
        case $1 in
            --type)
                test_type="$2"
                shift 2
                ;;
            *)
                shift
                ;;
        esac
    done
    
    # Setup
    check_python_version
    create_venv
    install_dependencies
    create_directories
    
    # Generate test data
    generate_test_data
    
    # Run linting and security checks
    run_linting
    run_security_checks
    
    # Run tests based on type
    case $test_type in
        "unit")
            run_tests "unit" "unit"
            ;;
        "integration")
            run_tests "integration" "integration"
            ;;
        "performance")
            run_tests "performance" "performance"
            ;;
        "security")
            run_tests "security" "security"
            ;;
        "all")
            run_tests "all" "unit or integration or performance or security"
            ;;
        *)
            handle_error "Invalid test type: $test_type"
            ;;
    esac
    
    log "Tests completed successfully!"
}

# Run main function
main "$@" 