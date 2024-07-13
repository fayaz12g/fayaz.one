# Function to check if Node.js is installed
function CheckNodeJS {
    $nodePath = Get-Command "node" -ErrorAction SilentlyContinue
    return $null -ne $nodePath
}

# Function to install Node.js
function Install-NodeJS {
    Write-Output "Downloading Node.js installer..."
    $nodeInstallerUrl = "https://nodejs.org/dist/v14.17.0/node-v14.17.0-x64.msi"
    $nodeInstallerPath = [System.IO.Path]::Combine($env:TEMP, "nodejs-installer.msi")
    Invoke-WebRequest -Uri $nodeInstallerUrl -OutFile $nodeInstallerPath
    Write-Output "Installing Node.js..."
    Start-Process msiexec.exe -ArgumentList "/i", $nodeInstallerPath, "/quiet", "/norestart" -Wait
    Remove-Item $nodeInstallerPath
}

# Function to open Chrome in full-screen mode
function Open-FullScreenChrome {
    param (
        [string]$Url
    )
    
    $chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
    $chromeArguments = "--new-window", "--start-fullscreen", $Url
    
    if (Test-Path $chromePath) {
        Start-Process -FilePath $chromePath -ArgumentList $chromeArguments
    } else {
        Write-Output "Chrome not found. Opening in default browser..."
        Start-Process $Url
    }
}

# Navigate to the script's directory
cd $PSScriptRoot

# Check if Node.js is installed, install if not
if (-Not (CheckNodeJS)) {
    Write-Output "Node.js is not installed. Installing Node.js..."
    Install-NodeJS
} else {
    Write-Output "Node.js is already installed."
}

# Start the Node.js server
Write-Output "Starting Node.js server..."
Start-Process "node" -ArgumentList "server.js"

# Open fayaz.one with a query parameter in a full-screen Chrome window
Write-Output "Opening browser window..."
Open-FullScreenChrome -Url "http://fayaz.one?ipAddress=localhost"