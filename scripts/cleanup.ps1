# Create archive directory if it doesn't exist
$archiveDir = "archive"
if (-not (Test-Path $archiveDir)) {
    New-Item -ItemType Directory -Path $archiveDir
}

# Function to check if a file is used
function Is-FileUsed {
    param (
        [string]$filePath
    )
    
    # Get the file name without extension
    $fileName = [System.IO.Path]::GetFileNameWithoutExtension($filePath)
    
    # Search for references to this file in the codebase
    $grepResult = Get-ChildItem -Recurse -File | 
        Where-Object { $_.FullName -notlike "*$archiveDir*" } |
        Select-String -Pattern $fileName -Quiet
    
    return $grepResult
}

# Get all Python files
$pythonFiles = Get-ChildItem -Recurse -Filter "*.py" | 
    Where-Object { $_.FullName -notlike "*$archiveDir*" }

# Get all TypeScript/JavaScript files
$tsFiles = Get-ChildItem -Recurse -Filter "*.ts" | 
    Where-Object { $_.FullName -notlike "*$archiveDir*" }
$jsFiles = Get-ChildItem -Recurse -Filter "*.js" | 
    Where-Object { $_.FullName -notlike "*$archiveDir*" }

# Combine all files
$allFiles = $pythonFiles + $tsFiles + $jsFiles

# Process each file
foreach ($file in $allFiles) {
    if (-not (Is-FileUsed $file.FullName)) {
        Write-Host "Moving unused file: $($file.FullName)"
        
        # Create archive subdirectory structure
        $relativePath = $file.FullName.Substring((Get-Location).Path.Length + 1)
        $archivePath = Join-Path $archiveDir $relativePath
        $archiveDirPath = Split-Path $archivePath -Parent
        
        if (-not (Test-Path $archiveDirPath)) {
            New-Item -ItemType Directory -Path $archiveDirPath -Force
        }
        
        # Move the file
        Move-Item $file.FullName $archivePath -Force
    }
}

# Clean up empty directories
Get-ChildItem -Recurse -Directory | 
    Where-Object { $_.FullName -notlike "*$archiveDir*" } |
    Where-Object { (Get-ChildItem $_.FullName -Recurse -File).Count -eq 0 } |
    ForEach-Object {
        Write-Host "Removing empty directory: $($_.FullName)"
        Remove-Item $_.FullName -Force
    }

Write-Host "Cleanup completed successfully!" 