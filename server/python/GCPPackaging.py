import tkinter as tk
from tkinter import filedialog, messagebox
import os
import json
import zipfile
import shutil
import tempfile

def shift_bits(file_path, shift_up=True):
    with open(file_path, 'rb') as file:
        data = bytearray(file.read())
    
    for i in range(len(data)):
        if shift_up:
            data[i] = (data[i] << 1) & 255
        else:
            data[i] = (data[i] >> 1) & 255
    
    with open(file_path, 'wb') as file:
        file.write(data)

def compress_pack():
    folder_path = filedialog.askdirectory(title="Select pack folder to compress")
    if not folder_path:
        return
    
    if not is_valid_pack(folder_path):
        messagebox.showerror("Error", "Not a valid guessing pack.")
        return
    
    pack_name = os.path.basename(folder_path)
    output_path = os.path.join(os.path.dirname(folder_path), f"{pack_name}.gcp")
    
    # Create a temporary working directory
    with tempfile.TemporaryDirectory() as temp_dir:
        # Copy the entire pack structure to the temp directory
        temp_pack_dir = os.path.join(temp_dir, pack_name)
        shutil.copytree(folder_path, temp_pack_dir)
        
        # Process deck folder
        deck_path = os.path.join(temp_pack_dir, "deck")
        for file in os.listdir(deck_path):
            if file.endswith(".json"):
                file_path = os.path.join(deck_path, file)
                shift_bits(file_path, shift_up=True)
                os.rename(file_path, file_path[:-5] + ".gcd")
        
        with zipfile.ZipFile(os.path.join(temp_pack_dir, "deck.gcdp"), 'w') as zipf:
            for root, _, files in os.walk(deck_path):
                for file in files:
                    zipf.write(os.path.join(root, file), file)
        
        # Process image folder
        image_path = os.path.join(temp_pack_dir, "image")
        for file in os.listdir(image_path):
            if file.endswith(".png"):
                file_path = os.path.join(image_path, file)
                # Instead of bit-shifting, just rename the PNG files
                os.rename(file_path, file_path[:-4] + ".gci")
        
        with zipfile.ZipFile(os.path.join(temp_pack_dir, "image.gcip"), 'w') as zipf:
            for root, _, files in os.walk(image_path):
                for file in files:
                    zipf.write(os.path.join(root, file), file)
        
        
        # Process sound folder
        sound_path = os.path.join(temp_pack_dir, "sound")
        for file in os.listdir(sound_path):
            if file.endswith(".m4a"):
                file_path = os.path.join(sound_path, file)
                os.rename(file_path, file_path[:-4] + ".gcs")
        
        with zipfile.ZipFile(os.path.join(temp_pack_dir, "sound.gcsp"), 'w') as zipf:
            for root, _, files in os.walk(sound_path):
                for file in files:
                    zipf.write(os.path.join(root, file), file)

        # Delete temporary deck and image and sound folders
        shutil.rmtree(deck_path)
        shutil.rmtree(image_path)
        shutil.rmtree(sound_path)
        
        # Create final ZIP archive
        with zipfile.ZipFile(output_path, 'w') as zipf:
            zipf.write(os.path.join(temp_pack_dir, "info.json"), "info.json")
            zipf.write(os.path.join(temp_pack_dir, "deck.gcdp"), "deck.gcdp")
            zipf.write(os.path.join(temp_pack_dir, "image.gcip"), "image.gcip")
            zipf.write(os.path.join(temp_pack_dir, "sound.gcsp"), "sound.gcsp")
    
    messagebox.showinfo("Success", f"Pack compressed and saved as {output_path}")

def decompress_pack():
        file_path = filedialog.askopenfilename(title="Select GCP file", filetypes=[("GCP files", "*.gcp")])
        if not file_path:
            return

        current_gcp_path = file_path
        temp_dir = tempfile.mkdtemp()

        try:
            # Decompress the GCP file
            with zipfile.ZipFile(file_path, 'r') as zipf:
                zipf.extractall(temp_dir)

            # Ensure required directories exist
            for dir_name in ['deck', 'image', 'sound']:
                os.makedirs(os.path.join(temp_dir, dir_name), exist_ok=True)

            # Decompress deck.gcdp if it exists
            deck_file = os.path.join(temp_dir, "deck.gcdp")
            if os.path.exists(deck_file):
                decompress_file(deck_file, "deck", ".json", temp_dir)
                os.remove(deck_file)

            # Decompress image.gcip if it exists
            image_file = os.path.join(temp_dir, "image.gcip")
            if os.path.exists(image_file):
                decompress_file(image_file, "image", ".png", temp_dir)
                os.remove(image_file)

            # Decompress sound.gcsp if it exists
            sound_file = os.path.join(temp_dir, "sound.gcsp")
            if os.path.exists(sound_file):
                decompress_file(sound_file, "sound", ".m4a", temp_dir)
                os.remove(sound_file)
    
            messagebox.showinfo("Success", f"Pack decompressed and saved in {temp_dir}")
            os.startfile(temp_dir)

        except Exception as e:
            messagebox.showerror("Error", f"Failed to open GCP file: {str(e)}")

def decompress_file(file_path, target_dir, file_extension, temp_dir):
    if os.path.exists(file_path):
        target_dir_path = os.path.join(temp_dir, target_dir)
        with zipfile.ZipFile(file_path, 'r') as zipf:
            zipf.extractall(target_dir_path)
        
        # Rename and shift bits for decompressed files
        for file in os.listdir(target_dir_path):
            old_path = os.path.join(target_dir_path, file)
            file_name, file_ext = os.path.splitext(file)
            new_path = os.path.join(target_dir_path, file_name + file_extension)

            if file_ext in ['.gcd', '.gci', '.gcs']:
                if file_ext == '.gcd':
                    shift_bits(old_path, shift_up=False)
                os.rename(old_path, new_path)

def is_valid_pack(folder_path):
    if not os.path.isfile(os.path.join(folder_path, "info.json")):
        return False
    
    with open(os.path.join(folder_path, "info.json"), 'r') as f:
        info = json.load(f)
    
    if not all(key in info for key in ["id", "name", "cards"]):
        return False
    
    if not os.path.isdir(os.path.join(folder_path, "deck")) or not os.path.isdir(os.path.join(folder_path, "image")):
        return False
    
    deck_files = set(os.path.splitext(f)[0] for f in os.listdir(os.path.join(folder_path, "deck")) if f.endswith('.json'))
    image_files = set(os.path.splitext(f)[0] for f in os.listdir(os.path.join(folder_path, "image")) if f.endswith('.png'))
    
    card_ids = set(card[list(card.keys())[0]]["id"] for card in info["cards"])
    
    return deck_files == card_ids and image_files == card_ids

# GUI setup
root = tk.Tk()
root.title("Deck Pack Compressor/Decompressor")
root.geometry('300x200')

compress_button = tk.Button(root, text="Compress Pack", command=compress_pack)
compress_button.pack(pady=10)

decompress_button = tk.Button(root, text="Decompress Pack", command=decompress_pack)
decompress_button.pack(pady=10)

root.mainloop()