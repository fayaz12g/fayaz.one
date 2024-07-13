# Navigate to the script's directory
cd $PSScriptRoot

# Start the Node.js server
Write-Output "Starting Node.js server..."
Start-Process "node" -ArgumentList "server.js"

# Open a new full screen browser window and set session storage
Write-Output "Opening browser window..."
$script = @"
(function() {
    var newWindow = window.open('http://fayaz.one', '', 'fullscreen=yes');
    newWindow.onload = function() {
        newWindow.sessionStorage.setItem('ipAddress', 'localhost');
        newWindow.location.href = 'http://fayaz.one';
    };
})();
"@

Start-Process "mshta.exe" "javascript:`"$script`""
