#!/bin/bash

# Function to check if Node.js is installed
function check_nodejs {
    if command -v node &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to install Node.js
function install_nodejs {
    echo "Downloading and installing Node.js..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install node
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y nodejs npm
        elif command -v pacman &> /dev/null; then
            sudo pacman -Syu nodejs npm
        else
            echo "Unsupported package manager. Please install Node.js manually."
            exit 1
        fi
    else
        echo "Unsupported operating system"
        exit 1
    fi
}

# Function to open Chrome in full-screen mode
function open_fullscreen_chrome {
    local url=$1
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if [ -d "/Applications/Google Chrome.app" ]; then
            open -a "Google Chrome" --args --new-window --start-fullscreen "$url"
        else
            echo "Chrome not found. Opening in default browser..."
            open "$url"
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v google-chrome &> /dev/null; then
            google-chrome --new-window --start-fullscreen "$url"
        else
            echo "Chrome not found. Opening in default browser..."
            xdg-open "$url"
        fi
    else
        echo "Unsupported operating system"
        exit 1
    fi
}

# Navigate to the script's directory
cd "$(dirname "$0")"

# Check if Node.js is installed, install if not
if ! check_nodejs; then
    echo "Node.js is not installed. Installing Node.js..."
    install_nodejs
else
    echo "Node.js is already installed."
fi

# Start the Node.js server
echo "Starting Node.js server..."
node server.js &

# Open fayaz.one with a query parameter in a full-screen Chrome window
echo "Opening browser window..."
open_fullscreen_chrome "http://fayaz.one?ipAddress=localhost"