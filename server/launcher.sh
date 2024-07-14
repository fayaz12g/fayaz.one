#!/bin/bash

# Set variables
folder_name="FayazOne"
version_file="version.txt"
repo_url="https://github.com/fayaz12g/fayaz12g.github.io/archive/master.zip"
repo_zip_path="/tmp/server.zip"
repo_extract_path="/tmp/fayaz12g.github.io-master/server"

# Detect OS and set app_folder accordingly
if [[ "$OSTYPE" == "darwin"* ]]; then
    app_folder="$HOME/Library/Application Support/$folder_name"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    app_folder="$HOME/.local/share/$folder_name"
else
    echo "Unsupported operating system"
    exit 1
fi

# Function to download and extract the server files
function download_and_extract {
    echo "Downloading server files..."
    curl -L "$repo_url" -o "$repo_zip_path"
    echo "Extracting server files..."
    unzip -q "$repo_zip_path" -d "/tmp"
    rm -rf "$app_folder"
    mv "$repo_extract_path" "$app_folder"
}

# Check if the folder exists and if it needs updating
if [ ! -d "$app_folder" ] || [ ! -f "$app_folder/$version_file" ]; then
    download_and_extract
else
    # Check if the server version is up to date
    local_version=$(cat "$app_folder/$version_file")
    remote_version=$(curl -s "https://raw.githubusercontent.com/fayaz12g/fayaz12g.github.io/master/server/version.txt")
    if [ "$local_version" != "$remote_version" ]; then
        download_and_extract
    fi
fi

# Launch the second script
second_script="$app_folder/start.sh"
bash "$second_script"