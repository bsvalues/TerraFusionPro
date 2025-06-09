# TerraFusion Enterprise Setup
# Copyright (c) 2024 TerraFusion Technologies
# All Rights Reserved

# Import required modules
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName PresentationCore, PresentationFramework

# Global variables
$script:SetupStatus = @{
    CurrentStep = 0
    TotalSteps = 0
    Errors = @()
    Warnings = @()
    StartTime = Get-Date
}

# UI Configuration
$script:UIConfig = @{
    WindowTitle = "TerraFusion Enterprise Setup"
    WindowSize = @{ Width = 800; Height = 600 }
    Theme = @{
        Primary = "#0078D4"
        Secondary = "#2B88D8"
        Success = "#107C10"
        Warning = "#FFB900"
        Error = "#D13438"
        Background = "#FFFFFF"
        Text = "#323130"
    }
}

# Create main form
$form = New-Object System.Windows.Forms.Form
$form.Text = $UIConfig.WindowTitle
$form.Size = New-Object System.Drawing.Size($UIConfig.WindowSize.Width, $UIConfig.WindowSize.Height)
$form.StartPosition = "CenterScreen"
$form.BackColor = [System.Drawing.Color]::FromArgb(255, 255, 255)
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.MinimizeBox = $false

# Create progress panel
$progressPanel = New-Object System.Windows.Forms.Panel
$progressPanel.Location = New-Object System.Drawing.Point(20, 20)
$progressPanel.Size = New-Object System.Drawing.Size(760, 400)
$progressPanel.BackColor = [System.Drawing.Color]::FromArgb(245, 245, 245)
$form.Controls.Add($progressPanel)

# Create progress bar
$progressBar = New-Object System.Windows.Forms.ProgressBar
$progressBar.Location = New-Object System.Drawing.Point(20, 360)
$progressBar.Size = New-Object System.Drawing.Size(720, 20)
$progressBar.Style = "Continuous"
$progressPanel.Controls.Add($progressBar)

# Create status label
$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Location = New-Object System.Drawing.Point(20, 330)
$statusLabel.Size = New-Object System.Drawing.Size(720, 20)
$statusLabel.Text = "Initializing TerraFusion Setup..."
$statusLabel.Font = New-Object System.Drawing.Font("Segoe UI", 10)
$progressPanel.Controls.Add($statusLabel)

# Create log box
$logBox = New-Object System.Windows.Forms.RichTextBox
$logBox.Location = New-Object System.Drawing.Point(20, 20)
$logBox.Size = New-Object System.Drawing.Size(720, 300)
$logBox.ReadOnly = $true
$logBox.BackColor = [System.Drawing.Color]::White
$logBox.Font = New-Object System.Drawing.Font("Consolas", 9)
$progressPanel.Controls.Add($logBox)

# Create button panel
$buttonPanel = New-Object System.Windows.Forms.Panel
$buttonPanel.Location = New-Object System.Drawing.Point(20, 440)
$buttonPanel.Size = New-Object System.Drawing.Size(760, 100)
$form.Controls.Add($buttonPanel)

# Create start button
$startButton = New-Object System.Windows.Forms.Button
$startButton.Location = New-Object System.Drawing.Point(20, 20)
$startButton.Size = New-Object System.Drawing.Size(150, 40)
$startButton.Text = "Start Setup"
$startButton.Font = New-Object System.Drawing.Font("Segoe UI", 10)
$startButton.BackColor = [System.Drawing.Color]::FromArgb(0, 120, 212)
$startButton.ForeColor = [System.Drawing.Color]::White
$startButton.FlatStyle = "Flat"
$buttonPanel.Controls.Add($startButton)

# Create cancel button
$cancelButton = New-Object System.Windows.Forms.Button
$cancelButton.Location = New-Object System.Drawing.Point(190, 20)
$cancelButton.Size = New-Object System.Drawing.Size(150, 40)
$cancelButton.Text = "Cancel"
$cancelButton.Font = New-Object System.Drawing.Font("Segoe UI", 10)
$cancelButton.BackColor = [System.Drawing.Color]::FromArgb(200, 200, 200)
$cancelButton.ForeColor = [System.Drawing.Color]::Black
$cancelButton.FlatStyle = "Flat"
$buttonPanel.Controls.Add($cancelButton)

# Function to update progress
function Update-Progress {
    param (
        [string]$Status,
        [int]$Progress,
        [string]$LogMessage,
        [string]$MessageType = "Info"
    )
    
    $statusLabel.Text = $Status
    $progressBar.Value = $Progress
    
    $color = switch ($MessageType) {
        "Success" { [System.Drawing.Color]::FromArgb(16, 124, 16) }
        "Warning" { [System.Drawing.Color]::FromArgb(255, 185, 0) }
        "Error" { [System.Drawing.Color]::FromArgb(209, 52, 56) }
        default { [System.Drawing.Color]::Black }
    }
    
    $logBox.SelectionStart = $logBox.TextLength
    $logBox.SelectionLength = 0
    $logBox.SelectionColor = $color
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
            Update-Progress -Status "Missing prerequisite: $($prereq.Key)" -Progress 0 -LogMessage "Error: $($prereq.Key) is not installed" -MessageType "Error"
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
        Update-Progress -Status "Setup completed successfully!" -Progress 100 -LogMessage "TerraFusion setup completed successfully" -MessageType "Success"
        
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
        Update-Progress -Status "Setup failed!" -Progress 0 -LogMessage "Error: $_" -MessageType "Error"
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