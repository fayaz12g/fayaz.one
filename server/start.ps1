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

# Open fayaz.one with a query parameter
Write-Output "Opening browser window..."
Start-Process "http://fayaz.one?ipAddress=localhost"