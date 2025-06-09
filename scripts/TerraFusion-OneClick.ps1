# TerraFusion One-Click Deployment
# Copyright (c) 2024 TerraFusion Technologies

# Enable detailed error reporting
$ErrorActionPreference = "Stop"
$DebugPreference = "Continue"

# Function to write debug information
function Write-DebugInfo {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Debug "[$timestamp] [$Level] $Message"
}

# Function to handle errors
function Write-ErrorInfo {
    param(
        [string]$Message,
        [System.Management.Automation.ErrorRecord]$ErrorRecord
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $errorMessage = "[$timestamp] [ERROR] $Message`n"
    $errorMessage += "Exception Type: $($ErrorRecord.Exception.GetType().FullName)`n"
    $errorMessage += "Exception Message: $($ErrorRecord.Exception.Message)`n"
    $errorMessage += "Script Stack Trace: $($ErrorRecord.ScriptStackTrace)`n"
    Write-Debug $errorMessage
    if ($logBox -ne $null) {
        $logBox.AppendText("$errorMessage`n")
        $logBox.ScrollToCaret()
    }
}

# Add error handling to the form
try {
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing

    # Create the main form
    $form = New-Object System.Windows.Forms.Form
    $form.Text = "TerraFusion Deployment"
    $form.Size = New-Object System.Drawing.Size(800,600)
    $form.StartPosition = "CenterScreen"
    $form.BackColor = [System.Drawing.Color]::FromArgb(45,45,48)
    $form.ForeColor = [System.Drawing.Color]::White
    $form.Font = New-Object System.Drawing.Font("Segoe UI", 10)

    # Add error handling to form events
    $form.Add_FormClosing({
        param($sender, $e)
        Write-DebugInfo "Form is closing"
    })

    $form.Add_FormClosed({
        param($sender, $e)
        Write-DebugInfo "Form has closed"
    })

    # Create title label
    $titleLabel = New-Object System.Windows.Forms.Label
    $titleLabel.Text = "TerraFusion One-Click Deployment"
    $titleLabel.Font = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Bold)
    $titleLabel.ForeColor = [System.Drawing.Color]::FromArgb(0,120,215)
    $titleLabel.Location = New-Object System.Drawing.Point(20,20)
    $titleLabel.Size = New-Object System.Drawing.Size(760,40)
    $titleLabel.TextAlign = [System.Drawing.ContentAlignment]::MiddleCenter
    $form.Controls.Add($titleLabel)

    # Create progress bar
    $progressBar = New-Object System.Windows.Forms.ProgressBar
    $progressBar.Location = New-Object System.Drawing.Point(20,80)
    $progressBar.Size = New-Object System.Drawing.Size(760,30)
    $progressBar.Style = "Continuous"
    $progressBar.ForeColor = [System.Drawing.Color]::FromArgb(0,120,215)
    $form.Controls.Add($progressBar)

    # Create status label
    $statusLabel = New-Object System.Windows.Forms.Label
    $statusLabel.Location = New-Object System.Drawing.Point(20,120)
    $statusLabel.Size = New-Object System.Drawing.Size(760,30)
    $statusLabel.Text = "Initializing..."
    $statusLabel.TextAlign = [System.Drawing.ContentAlignment]::MiddleCenter
    $form.Controls.Add($statusLabel)

    # Create log box
    $logBox = New-Object System.Windows.Forms.RichTextBox
    $logBox.Location = New-Object System.Drawing.Point(20,160)
    $logBox.Size = New-Object System.Drawing.Size(760,380)
    $logBox.BackColor = [System.Drawing.Color]::FromArgb(30,30,30)
    $logBox.ForeColor = [System.Drawing.Color]::White
    $logBox.Font = New-Object System.Drawing.Font("Consolas", 10)
    $logBox.ReadOnly = $true
    $form.Controls.Add($logBox)

    # Function to update progress with error handling
    function Update-Progress {
        param(
            [int]$Percent,
            [string]$Status,
            [string]$LogMessage
        )
        try {
            Write-DebugInfo "Updating progress: $Percent% - $Status"
            $progressBar.Value = $Percent
            $statusLabel.Text = $Status
            $logBox.AppendText("$LogMessage`n")
            $logBox.ScrollToCaret()
            [System.Windows.Forms.Application]::DoEvents()
        } catch {
            Write-ErrorInfo "Failed to update progress" $_
            throw
        }
    }

    # Function to check and install Chocolatey if not present
    function Install-Chocolatey {
        Update-Progress -Percent 5 -Status "Checking Chocolatey..." -LogMessage "Checking for Chocolatey package manager..."
        if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
            Update-Progress -Percent 10 -Status "Installing Chocolatey..." -LogMessage "Installing Chocolatey package manager..."
            Set-ExecutionPolicy Bypass -Scope Process -Force
            [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
            Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
            Update-Progress -Percent 15 -Status "Chocolatey installed" -LogMessage "Chocolatey installation completed successfully."
        } else {
            Update-Progress -Percent 15 -Status "Chocolatey found" -LogMessage "Chocolatey is already installed."
        }
    }

    # Function to install and configure PostgreSQL
    function Install-PostgreSQL {
        Update-Progress -Percent 20 -Status "Setting up PostgreSQL..." -LogMessage "Checking PostgreSQL installation..."
        
        try {
            if (-not (Get-Service -Name postgresql* -ErrorAction SilentlyContinue)) {
                Update-Progress -Percent 25 -Status "Installing PostgreSQL..." -LogMessage "Installing PostgreSQL database..."
                
                # Install PostgreSQL using Chocolatey
                choco install postgresql --version=15.5 -y --force
                
                # Refresh environment variables
                $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
                
                # Wait for PostgreSQL service to be available
                Start-Sleep -Seconds 30
                
                Update-Progress -Percent 30 -Status "Configuring PostgreSQL..." -LogMessage "Configuring PostgreSQL database..."
                
                # Find PostgreSQL installation directory
                $pgPath = Get-ChildItem "C:\Program Files\PostgreSQL" -Directory | Sort-Object Name -Descending | Select-Object -First 1
                if (-not $pgPath) {
                    throw "PostgreSQL installation directory not found"
                }
                
                $pgBinPath = Join-Path $pgPath.FullName "bin"
                if (-not (Test-Path $pgBinPath)) {
                    throw "PostgreSQL bin directory not found at: $pgBinPath"
                }
                
                # Set PGPASSWORD environment variable for non-interactive authentication
                $env:PGPASSWORD = "postgres"
                
                # Create database and user
                & "$pgBinPath\createdb.exe" -U postgres terrafusion
                if ($LASTEXITCODE -ne 0) {
                    throw "Failed to create database"
                }
                
                & "$pgBinPath\psql.exe" -U postgres -d terrafusion -c "CREATE USER terrafusion WITH PASSWORD 'terrafusion';"
                if ($LASTEXITCODE -ne 0) {
                    throw "Failed to create user"
                }
                
                & "$pgBinPath\psql.exe" -U postgres -d terrafusion -c "GRANT ALL PRIVILEGES ON DATABASE terrafusion TO terrafusion;"
                if ($LASTEXITCODE -ne 0) {
                    throw "Failed to grant privileges"
                }
                
                Update-Progress -Percent 35 -Status "PostgreSQL configured" -LogMessage "PostgreSQL installation and configuration completed successfully."
            } else {
                Update-Progress -Percent 35 -Status "PostgreSQL found" -LogMessage "PostgreSQL is already installed."
                
                # Verify PostgreSQL is working
                $pgPath = Get-ChildItem "C:\Program Files\PostgreSQL" -Directory | Sort-Object Name -Descending | Select-Object -First 1
                if ($pgPath) {
                    $pgBinPath = Join-Path $pgPath.FullName "bin"
                    if (Test-Path $pgBinPath) {
                        $env:PGPASSWORD = "postgres"
                        & "$pgBinPath\psql.exe" -U postgres -c "SELECT version();" | Out-Null
                        if ($LASTEXITCODE -eq 0) {
                            Update-Progress -Percent 35 -Status "PostgreSQL verified" -LogMessage "PostgreSQL is working correctly."
                        } else {
                            throw "PostgreSQL installation is not working correctly"
                        }
                    }
                }
            }
        } catch {
            Update-Progress -Percent 0 -Status "PostgreSQL setup failed" -LogMessage "PostgreSQL installation failed: $_"
            throw "PostgreSQL installation failed: $_"
        } finally {
            # Clear PGPASSWORD for security
            Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
        }
    }

    # Function to install and configure Redis
    function Install-Redis {
        Update-Progress -Percent 40 -Status "Setting up Redis..." -LogMessage "Checking Redis installation..."
        if (-not (Get-Service -Name redis* -ErrorAction SilentlyContinue)) {
            Update-Progress -Percent 45 -Status "Installing Redis..." -LogMessage "Installing Redis server..."
            choco install redis-64 -y
            Update-Progress -Percent 50 -Status "Starting Redis..." -LogMessage "Starting Redis service..."
            Start-Service Redis
            Update-Progress -Percent 55 -Status "Redis configured" -LogMessage "Redis installation and configuration completed."
        } else {
            Update-Progress -Percent 55 -Status "Redis found" -LogMessage "Redis is already installed."
        }
    }

    # Function to setup Python environment
    function Setup-PythonEnvironment {
        Update-Progress -Percent 60 -Status "Setting up Python..." -LogMessage "Checking Python installation..."
        if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
            Update-Progress -Percent 65 -Status "Installing Python..." -LogMessage "Installing Python..."
            choco install python -y
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        }
        
        try {
            Update-Progress -Percent 70 -Status "Configuring Python..." -LogMessage "Upgrading pip and installing dependencies..."
            python -m pip install --upgrade pip setuptools wheel
            if (-not (Test-Path "venv")) {
                Update-Progress -Percent 75 -Status "Creating virtual environment..." -LogMessage "Creating Python virtual environment..."
                python -m venv venv
            }
            Update-Progress -Percent 80 -Status "Installing Python packages..." -LogMessage "Installing Python dependencies..."
            & ".\venv\Scripts\Activate.ps1"
            pip install -r requirements.txt
            Update-Progress -Percent 85 -Status "Python configured" -LogMessage "Python environment setup completed."
            return $true
        } catch {
            Update-Progress -Percent 0 -Status "Python setup failed" -LogMessage "Python environment setup failed: $_"
            return $false
        }
    }

    # Function to setup Node.js environment
    function Setup-NodeEnvironment {
        Update-Progress -Percent 90 -Status "Setting up Node.js..." -LogMessage "Checking Node.js installation..."
        if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
            Update-Progress -Percent 92 -Status "Installing Node.js..." -LogMessage "Installing Node.js..."
            choco install nodejs -y
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        }
        
        try {
            if (Test-Path "package.json") {
                Update-Progress -Percent 95 -Status "Installing Node.js packages..." -LogMessage "Installing Node.js dependencies..."
                npm install
            }
            Update-Progress -Percent 98 -Status "Node.js configured" -LogMessage "Node.js environment setup completed."
            return $true
        } catch {
            Update-Progress -Percent 0 -Status "Node.js setup failed" -LogMessage "Node.js environment setup failed: $_"
            return $false
        }
    }

    # Function to setup environment variables
    function Setup-Environment {
        Update-Progress -Percent 99 -Status "Configuring environment..." -LogMessage "Setting up environment variables..."
        $envContent = @"
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=terrafusion
DB_USER=terrafusion
DB_PASSWORD=terrafusion

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Application Configuration
APP_ENV=development
APP_DEBUG=true
APP_PORT=5000
"@
        Set-Content -Path ".env" -Value $envContent
        Update-Progress -Percent 100 -Status "Environment configured" -LogMessage "Environment variables setup completed."
    }

    # Function to start all services
    function Start-Services {
        Update-Progress -Percent 100 -Status "Starting services..." -LogMessage "Starting all required services..."
        
        # Start PostgreSQL if not running
        if (-not (Get-Service -Name postgresql* | Where-Object Status -eq 'Running')) {
            Start-Service postgresql*
            $logBox.AppendText("PostgreSQL service started.`n")
        }
        
        # Start Redis if not running
        if (-not (Get-Service -Name redis* | Where-Object Status -eq 'Running')) {
            Start-Service Redis
            $logBox.AppendText("Redis service started.`n")
        }
        
        # Start the application
        $logBox.AppendText("Starting TerraFusion application...`n")
        Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"cd '$PWD'; .\venv\Scripts\Activate.ps1; python -m uvicorn main:app --reload`""
        
        # Start frontend if it exists
        if (Test-Path "package.json") {
            $logBox.AppendText("Starting frontend development server...`n")
            Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"cd '$PWD'; npm start`""
        }
        
        $logBox.AppendText("`nAll services started successfully!`n")
    }

    # Main deployment function with error handling
    function Start-Deployment {
        try {
            Write-DebugInfo "Starting deployment process"
            
            # Check for admin privileges
            $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
            if (-not $isAdmin) {
                Write-DebugInfo "Script requires admin privileges" "WARNING"
                $logBox.AppendText("This script requires administrator privileges. Please run as administrator.`n")
                Start-Process powershell -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
                $form.Close()
                return
            }

            # Install Chocolatey
            Install-Chocolatey
            
            # Install and configure services
            Install-PostgreSQL
            Install-Redis
            
            # Setup environments
            if (-not (Setup-PythonEnvironment)) {
                throw "Python environment setup failed"
            }
            if (-not (Setup-NodeEnvironment)) {
                throw "Node.js environment setup failed"
            }
            
            # Setup environment variables
            Setup-Environment
            
            # Start all services
            Start-Services
            
            $logBox.AppendText("`nTerraFusion deployment completed successfully!`n")
            $logBox.AppendText("`nThe application should now be running at:`n")
            $logBox.AppendText("- Backend: http://localhost:5000`n")
            $logBox.AppendText("- Frontend: http://localhost:3000 (if applicable)`n")
            $logBox.AppendText("`nPress Ctrl+C in the respective terminal windows to stop the services.`n")
            
            $statusLabel.Text = "Deployment Complete!"
            $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(0,255,0)
            
            Write-DebugInfo "Deployment completed successfully"
        } catch {
            Write-ErrorInfo "Deployment failed" $_
            $logBox.AppendText("`nDeployment failed: $($_.Exception.Message)`n")
            $statusLabel.Text = "Deployment Failed!"
            $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(255,0,0)
        }
    }

    # Add error handling to form shown event
    $form.Add_Shown({
        try {
            Write-DebugInfo "Form shown event triggered"
            Start-Deployment
        } catch {
            Write-ErrorInfo "Error in form shown event" $_
            $logBox.AppendText("`nCritical error: $($_.Exception.Message)`n")
            $statusLabel.Text = "Critical Error!"
            $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(255,0,0)
        }
    })

    # Show the form
    Write-DebugInfo "Showing form"
    $form.ShowDialog()
} catch {
    Write-ErrorInfo "Critical error in form initialization" $_
    [System.Windows.Forms.MessageBox]::Show(
        "Critical error: $($_.Exception.Message)`n`nPlease check the debug log for more information.",
        "TerraFusion Deployment Error",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Error
    )
} 