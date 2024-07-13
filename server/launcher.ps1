# Set variables
$folderName = "FayazOne"
$versionFile = "version.txt"
$localAppData = [System.Environment]::GetFolderPath('LocalApplicationData')
$appFolder = Join-Path $localAppData $folderName
$repoUrl = "https://github.com/fayaz12g/fayaz12g.github.io/archive/master.zip"
$repoZipPath = Join-Path $env:TEMP "server.zip"
$repoExtractPath = Join-Path $env:TEMP "fayaz12g.github.io-master\server"

# Function to download and extract the server files
function Download-And-Extract {
    Write-Output "Downloading server files..."
    Invoke-WebRequest -Uri $repoUrl -OutFile $repoZipPath
    Write-Output "Extracting server files..."
    Expand-Archive -Path $repoZipPath -DestinationPath $env:TEMP -Force
    if (Test-Path $appFolder) {
        Remove-Item -Recurse -Force $appFolder
    }
    Move-Item -Path $repoExtractPath -Destination $appFolder
}

# Check if the folder exists and if it needs updating
if (-Not (Test-Path $appFolder) -or -Not (Test-Path (Join-Path $appFolder $versionFile))) {
    Download-And-Extract
} else {
    # Check if the server version is up to date
    $localVersion = Get-Content (Join-Path $appFolder $versionFile)
    $remoteVersion = (Invoke-WebRequest -Uri "https://raw.githubusercontent.com/fayaz12g/fayaz12g.github.io/master/server/version.txt").Content
    if ($localVersion -ne $remoteVersion) {
        Download-And-Extract
    }
}

# Launch the second script
$secondScript = Join-Path $appFolder "start.ps1"
Start-Process powershell.exe -ArgumentList "-File $secondScript"
