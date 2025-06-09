# TerraFusion Enterprise Setup
# Copyright (c) 2024 TerraFusion Technologies

# Import required modules
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Create main form
$form = New-Object System.Windows.Forms.Form
$form.Text = "TerraFusion Setup"
$form.Size = New-Object System.Drawing.Size(600, 400)
$form.StartPosition = "CenterScreen"

# Create progress bar
$progressBar = New-Object System.Windows.Forms.ProgressBar
$progressBar.Location = New-Object System.Drawing.Point(20, 20)
$progressBar.Size = New-Object System.Drawing.Size(560, 20)
$form.Controls.Add($progressBar)

# Create status label
$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Location = New-Object System.Drawing.Point(20, 50)
$statusLabel.Size = New-Object System.Drawing.Size(560, 20)
$statusLabel.Text = "Ready to start setup..."
$form.Controls.Add($statusLabel)

# Create start button
$startButton = New-Object System.Windows.Forms.Button
$startButton.Location = New-Object System.Drawing.Point(20, 80)
$startButton.Size = New-Object System.Drawing.Size(100, 30)
$startButton.Text = "Start Setup"
$form.Controls.Add($startButton)

# Function to update progress
function Update-Progress {
    param (
        [string]$Status,
        [int]$Progress
    )
    $statusLabel.Text = $Status
    $progressBar.Value = $Progress
    [System.Windows.Forms.Application]::DoEvents()
}

# Function to check prerequisites
function Test-Prerequisites {
    Update-Progress -Status "Checking prerequisites..." -Progress 10
    
    $prerequisites = @{
        "Docker Desktop" = { Get-Command docker -ErrorAction SilentlyContinue }
        "Node.js" = { Get-Command node -ErrorAction SilentlyContinue }
        "Yarn" = { Get-Command yarn -ErrorAction SilentlyContinue }
        "kubectl" = { Get-Command kubectl -ErrorAction SilentlyContinue }
    }
    
    foreach ($prereq in $prerequisites.GetEnumerator()) {
        if (-not (& $prereq.Value)) {
            Update-Progress -Status "Missing: $($prereq.Key)" -Progress 0
            return $false
        }
    }
    return $true
}

# Function to execute setup
function Start-Setup {
    try {
        if (-not (Test-Prerequisites)) {
            throw "Prerequisites check failed"
        }
        
        Update-Progress -Status "Setting up environment..." -Progress 20
        & ".\scripts\setup.ps1"
        
        Update-Progress -Status "Configuring project..." -Progress 40
        & ".\scripts\init-project.sh"
        & ".\scripts\run-migrations.sh"
        
        Update-Progress -Status "Starting services..." -Progress 60
        & ".\scripts\run_services.ps1"
        & ".\scripts\deploy_k8s.ps1"
        
        Update-Progress -Status "Verifying setup..." -Progress 80
        & ".\scripts\health-check.sh"
        
        Update-Progress -Status "Setup completed!" -Progress 100
        [System.Windows.Forms.MessageBox]::Show("Setup completed successfully!", "Complete")
        $form.Close()
    }
    catch {
        Update-Progress -Status "Setup failed!" -Progress 0
        [System.Windows.Forms.MessageBox]::Show("Setup failed: $_", "Error")
    }
}

# Add event handler
$startButton.Add_Click({ Start-Setup })

# Show the form
$form.ShowDialog() 