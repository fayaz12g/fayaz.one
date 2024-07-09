@echo off

:: Start the Node.js server
start "" node server.js

:: Wait for a few seconds to ensure the server has started
timeout /t 0

:: Prepare the JavaScript to set the variables and simulate a click for autoplay
set "js=javascript:(function() { window.onload = function() { setTimeout(function() { const event = new Event('setIpAddress'); window.dispatchEvent(event); document.body.click(); }, 1000); }; window.addEventListener('setIpAddress', function() { const [ipAddress, setIpAddress] = window.React.useState('localhost'); const [role, setRole] = window.React.useState('host'); setIpAddress('localhost'); setRole('host'); }); })();"

:: Try to open Google Chrome in fullscreen mode
start "" chrome --new-window --start-fullscreen --app="http://fayaz.one/#%js%"


:: If Google Chrome is not available, try with Microsoft Edge
if %errorlevel% neq 0 (
    start "" msedge --new-window --kiosk "http://fayaz.one#%js%"
)

:: If Microsoft Edge is not available, try with the default browser
if %errorlevel% neq 0 (
    start http://fayaz.one/improv#%js%
    echo Please set the variables manually for 'ipAddress' to 'localhost' and 'role' to 'host'
)

:: Keep the console window open
pause
