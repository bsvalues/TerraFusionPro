# TerraFusion Enterprise Setup
# Copyright (c) 2024 TerraFusion Technologies

# Import required modules
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Create main form
$form = New-Object System.Windows.Forms.Form
$form.Text = "TerraFusion Enterprise Setup"
$form.Size = New-Object System.Drawing.Size(800, 600)
$form.StartPosition = "CenterScreen"
$form.BackColor = [System.Drawing.Color]::White
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.MinimizeBox = $false

# Create progress bar
$progressBar = New-Object System.Windows.Forms.ProgressBar
$progressBar.Location = New-Object System.Drawing.Point(20, 20)
$progressBar.Size = New-Object System.Drawing.Size(760, 20)
$progressBar.Style = "Continuous"
$form.Controls.Add($progressBar)

# Create status label
$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Location = New-Object System.Drawing.Point(20, 50)
$statusLabel.Size = New-Object System.Drawing.Size(760, 20)
$statusLabel.Text = "Initializing TerraFusion Setup..."
$statusLabel.Font = New-Object System.Drawing.Font("Segoe UI", 10)
$form.Controls.Add($statusLabel)

# Create log box
$logBox = New-Object System.Windows.Forms.RichTextBox
$logBox.Location = New-Object System.Drawing.Point(20, 80)
$logBox.Size = New-Object System.Drawing.Size(760, 400)
$logBox.ReadOnly = $true
$logBox.BackColor = [System.Drawing.Color]::White
$logBox.Font = New-Object System.Drawing.Font("Consolas", 9)
$form.Controls.Add($logBox)

# Create start button
$startButton = New-Object System.Windows.Forms.Button
$startButton.Location = New-Object System.Drawing.Point(20, 500)
$startButton.Size = New-Object System.Drawing.Size(150, 40)
$startButton.Text = "Start Setup"
$startButton.Font = New-Object System.Drawing.Font("Segoe UI", 10)
$startButton.BackColor = [System.Drawing.Color]::FromArgb(0, 120, 212)
$startButton.ForeColor = [System.Drawing.Color]::White
$startButton.FlatStyle = "Flat"
$form.Controls.Add($startButton)

# Create cancel button
$cancelButton = New-Object System.Windows.Forms.Button
$cancelButton.Location = New-Object System.Drawing.Point(190, 500)
$cancelButton.Size = New-Object System.Drawing.Size(150, 40)
$cancelButton.Text = "Cancel"
$cancelButton.Font = New-Object System.Drawing.Font("Segoe UI", 10)
$cancelButton.BackColor = [System.Drawing.Color]::FromArgb(200, 200, 200)
$cancelButton.ForeColor = [System.Drawing.Color]::Black
$cancelButton.FlatStyle = "Flat"
$form.Controls.Add($cancelButton)

# Function to update progress
function Update-Progress {
    param (
        [string]$Status,
        [int]$Progress,
        [string]$LogMessage
    )
    
    $statusLabel.Text = $Status
    $progressBar.Value = $Progress
    $logBox.AppendText("$([DateTime]::Now.ToString('HH:mm:ss')) - $LogMessage`r`n")
    $logBox.ScrollToCaret()
}

# Function to check prerequisites
function Test-Prerequisites {
    Update-Progress -Status "Checking prerequisites..." -Progress 10 -LogMessage "Verifying system requirements..."
    
    $prerequisites = @{
        "Docker Desktop" = { Get-Command docker -ErrorAction SilentlyContinue }
        "Node.js" = { Get-Command node -ErrorAction SilentlyContinue }
        "Yarn" = { Get-Command yarn -ErrorAction SilentlyContinue }
        "kubectl" = { Get-Command kubectl -ErrorAction SilentlyContinue }
    }
    
    foreach ($prereq in $prerequisites.GetEnumerator()) {
        if (-not (& $prereq.Value)) {
            Update-Progress -Status "Missing prerequisite: $($prereq.Key)" -Progress 0 -LogMessage "Error: $($prereq.Key) is not installed"
            return $false
        }
        Update-Progress -Status "Checking prerequisites..." -Progress 10 -LogMessage "✓ $($prereq.Key) is installed"
    }
    
    return $true
}

# Function to execute setup steps
function Start-Setup {
    param (
        [System.Windows.Forms.Button]$Button
    )
    
    $Button.Enabled = $false
    $cancelButton.Enabled = $true
    
    try {
        # Check prerequisites
        if (-not (Test-Prerequisites)) {
            throw "Prerequisites check failed"
        }
        
        # Phase 1: Primary Setup
        Update-Progress -Status "Setting up environment..." -Progress 20 -LogMessage "Starting primary setup phase"
        & ".\scripts\setup.ps1"
        
        # Phase 2: Secondary Setup
        Update-Progress -Status "Configuring project..." -Progress 40 -LogMessage "Starting secondary setup phase"
        & ".\scripts\init-project.sh"
        & ".\scripts\run-migrations.sh"
        & ".\scripts\setup_monitoring.py"
        
        # Phase 3: Service Management
        Update-Progress -Status "Starting services..." -Progress 60 -LogMessage "Starting service management phase"
        & ".\scripts\run_services.ps1"
        & ".\scripts\deploy_k8s.ps1"
        
        # Phase 4: Verification
        Update-Progress -Status "Verifying setup..." -Progress 80 -LogMessage "Starting verification phase"
        & ".\scripts\health-check.sh"
        & ".\scripts\verify-metrics.sh"
        & ".\scripts\check-logs.sh"
        
        # Complete
        Update-Progress -Status "Setup completed successfully!" -Progress 100 -LogMessage "TerraFusion setup completed successfully"
        
        # Show completion message
        [System.Windows.Forms.MessageBox]::Show(
            "TerraFusion has been successfully set up!`n`nYou can now start developing with TerraFusion.",
            "Setup Complete",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Information
        )
        
        $form.Close()
    }
    catch {
        Update-Progress -Status "Setup failed!" -Progress 0 -LogMessage "Error: $_"
        $Button.Enabled = $true
        $cancelButton.Enabled = $false
        
        [System.Windows.Forms.MessageBox]::Show(
            "Setup failed: $_`n`nPlease check the logs for more information.",
            "Setup Failed",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Error
        )
    }
}

# Add event handlers
$startButton.Add_Click({ Start-Setup -Button $startButton })
$cancelButton.Add_Click({ $form.Close() })
$cancelButton.Enabled = $false

# Show the form
$form.ShowDialog() 