import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import os
import json
import zipfile
import shutil
import tempfile

class GCPStudio:
    def __init__(self, root):
        self.root = root
        self.root.title("GCP Studio")
        self.root.geometry('800x600')

        self.temp_dir = None
        self.current_gcp_path = None

        self.setup_ui()

    def setup_ui(self):
        # Main frame
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)

        # Pack info frame
        pack_info_frame = ttk.LabelFrame(main_frame, text="Pack Info", padding="10")
        pack_info_frame.pack(fill=tk.X, pady=5)

        ttk.Label(pack_info_frame, text="Pack ID:").grid(row=0, column=0, sticky=tk.W)
        self.pack_id_entry = ttk.Entry(pack_info_frame)
        self.pack_id_entry.grid(row=0, column=1, sticky=tk.W)

        ttk.Label(pack_info_frame, text="Pack Name:").grid(row=1, column=0, sticky=tk.W)
        self.pack_name_entry = ttk.Entry(pack_info_frame)
        self.pack_name_entry.grid(row=1, column=1, sticky=tk.W)

        # Decks frame
        decks_frame = ttk.LabelFrame(main_frame, text="Decks", padding="10")
        decks_frame.pack(fill=tk.BOTH, expand=True, pady=5)

        self.decks_tree = ttk.Treeview(decks_frame, columns=('ID', 'Name', 'Color'), show='headings')
        self.decks_tree.heading('ID', text='ID')
        self.decks_tree.heading('Name', text='Name')
        self.decks_tree.heading('Color', text='Color')
        self.decks_tree.pack(fill=tk.BOTH, expand=True)

        self.decks_tree.bind('<Double-1>', self.edit_deck)

        # Buttons frame
        buttons_frame = ttk.Frame(main_frame)
        buttons_frame.pack(fill=tk.X, pady=5)

        ttk.Button(buttons_frame, text="Open GCP", command=self.open_gcp).pack(side=tk.LEFT, padx=5)
        ttk.Button(buttons_frame, text="Save GCP", command=self.save_gcp).pack(side=tk.LEFT, padx=5)
        ttk.Button(buttons_frame, text="Add Deck", command=self.add_deck).pack(side=tk.LEFT, padx=5)

    def open_gcp(self):
        file_path = filedialog.askopenfilename(title="Select GCP file", filetypes=[("GCP files", "*.gcp")])
        if not file_path:
            return

        self.current_gcp_path = file_path
        self.temp_dir = tempfile.mkdtemp()

        # Decompress the GCP file
        with zipfile.ZipFile(file_path, 'r') as zipf:
            zipf.extractall(self.temp_dir)

        # Decompress the deck.gcdp file
        deck_gcdp_path = os.path.join(self.temp_dir, "deck.gcdp")
        if os.path.exists(deck_gcdp_path):
            with zipfile.ZipFile(deck_gcdp_path, 'r') as zipf:
                zipf.extractall(os.path.join(self.temp_dir, "deck"))

        # Decompress the image.gcip file
        image_gcip_path = os.path.join(self.temp_dir, "image.gcip")
        if os.path.exists(image_gcip_path):
            with zipfile.ZipFile(image_gcip_path, 'r') as zipf:
                zipf.extractall(os.path.join(self.temp_dir, "image"))

        # Process deck files
        deck_path = os.path.join(self.temp_dir, "deck")
        for file in os.listdir(deck_path):
            if file.endswith(".gcd"):
                file_path = os.path.join(deck_path, file)
                self.shift_bits(file_path, shift_up=False)
                os.rename(file_path, file_path[:-4] + ".json")

        # Process image files
        image_path = os.path.join(self.temp_dir, "image")
        for file in os.listdir(image_path):
            if file.endswith(".gci"):
                file_path = os.path.join(image_path, file)
                os.rename(file_path, file_path[:-4] + ".png")

        # Load info.json
        with open(os.path.join(self.temp_dir, "info.json"), 'r') as f:
            info = json.load(f)

        # Update UI with pack info
        self.pack_id_entry.delete(0, tk.END)
        self.pack_id_entry.insert(0, info['id'])
        self.pack_name_entry.delete(0, tk.END)
        self.pack_name_entry.insert(0, info['name'])

        # Clear and update decks tree
        self.decks_tree.delete(*self.decks_tree.get_children())
        for card in info['cards']:
            deck = list(card.values())[0]
            self.decks_tree.insert('', 'end', values=(deck['id'], deck['name'], deck['color']))


    def save_gcp(self):
        if not self.temp_dir or not self.current_gcp_path:
            messagebox.showerror("Error", "No GCP file is currently open.")
            return

        # Update info.json
        info_path = os.path.join(self.temp_dir, "info.json")
        with open(info_path, 'r') as f:
            info = json.load(f)

        info['id'] = self.pack_id_entry.get()
        info['name'] = self.pack_name_entry.get()

        info['cards'] = []
        for item in self.decks_tree.get_children():
            values = self.decks_tree.item(item)['values']
            info['cards'].append({values[2]: {"id": values[0], "name": values[1], "color": values[2]}})

        with open(info_path, 'w') as f:
            json.dump(info, f, indent=2)

        # Compress the pack
        self.compress_pack(self.temp_dir, self.current_gcp_path)

        messagebox.showinfo("Success", f"Pack saved as {self.current_gcp_path}")

    def add_deck(self):
        # Open a dialog to get deck details
        dialog = tk.Toplevel(self.root)
        dialog.title("Add Deck")

        ttk.Label(dialog, text="Deck ID:").grid(row=0, column=0, sticky=tk.W)
        deck_id_entry = ttk.Entry(dialog)
        deck_id_entry.grid(row=0, column=1, sticky=tk.W)

        ttk.Label(dialog, text="Deck Name:").grid(row=1, column=0, sticky=tk.W)
        deck_name_entry = ttk.Entry(dialog)
        deck_name_entry.grid(row=1, column=1, sticky=tk.W)

        ttk.Label(dialog, text="Deck Color:").grid(row=2, column=0, sticky=tk.W)
        deck_color_entry = ttk.Entry(dialog)
        deck_color_entry.grid(row=2, column=1, sticky=tk.W)

        def save_deck():
            deck_id = deck_id_entry.get()
            deck_name = deck_name_entry.get()
            deck_color = deck_color_entry.get()

            if deck_id and deck_name and deck_color:
                self.decks_tree.insert('', 'end', values=(deck_id, deck_name, deck_color))
                # Create empty deck JSON file
                deck_path = os.path.join(self.temp_dir, "deck", f"{deck_id}.json")
                with open(deck_path, 'w') as f:
                    json.dump({"name": deck_name, "color": deck_color, "cards": []}, f, indent=2)
                dialog.destroy()
            else:
                messagebox.showerror("Error", "All fields are required.")

        ttk.Button(dialog, text="Save", command=save_deck).grid(row=3, column=0, columnspan=2, pady=10)

    def edit_deck(self, event):
        item = self.decks_tree.selection()[0]
        deck_id = self.decks_tree.item(item, "values")[0]

        # Open deck editing window
        deck_window = tk.Toplevel(self.root)
        deck_window.title(f"Editing Deck: {deck_id}")
        deck_window.geometry('600x400')

        # Load deck data
        deck_path = os.path.join(self.temp_dir, "deck", f"{deck_id}.json")
        with open(deck_path, 'r') as f:
            deck_data = json.load(f)

        # Create a frame for the cards
        cards_frame = ttk.Frame(deck_window)
        cards_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # Create a canvas and scrollbar
        canvas = tk.Canvas(cards_frame)
        scrollbar = ttk.Scrollbar(cards_frame, orient="vertical", command=canvas.yview)
        scrollable_frame = ttk.Frame(canvas)

        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(
                scrollregion=canvas.bbox("all")
            )
        )

        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)

        # Function to add a new card
        def add_card(answer="", hints=["", "", ""]):
            card_frame = ttk.Frame(scrollable_frame)
            card_frame.pack(fill=tk.X, padx=5, pady=5)

            ttk.Label(card_frame, text="Answer:").pack(side=tk.LEFT)
            answer_entry = ttk.Entry(card_frame)
            answer_entry.pack(side=tk.LEFT, expand=True, fill=tk.X)
            answer_entry.insert(0, answer)

            hints_frame = ttk.Frame(scrollable_frame)
            hints_frame.pack(fill=tk.X, padx=5, pady=5)

            hint_entries = []
            for i, hint in enumerate(hints):
                ttk.Label(hints_frame, text=f"Hint {i+1}:").grid(row=i, column=0, sticky=tk.W)
                hint_entry = ttk.Entry(hints_frame)
                hint_entry.grid(row=i, column=1, sticky=tk.EW)
                hint_entry.insert(0, hint)
                hint_entries.append(hint_entry)

            hints_frame.grid_columnconfigure(1, weight=1)

            return answer_entry, hint_entries

        # Add existing cards
        card_widgets = []
        for card in deck_data['cards']:
            card_widgets.append(add_card(card['answer'], card['hints']))

        # Add button to add new cards
        ttk.Button(deck_window, text="Add Card", command=lambda: card_widgets.append(add_card())).pack(pady=10)

        # Save button
        def save_deck():
            deck_data['cards'] = []
            for answer_entry, hint_entries in card_widgets:
                deck_data['cards'].append({
                    "answer": answer_entry.get(),
                    "hints": [hint.get() for hint in hint_entries]
                })
            with open(deck_path, 'w') as f:
                json.dump(deck_data, f, indent=2)
            deck_window.destroy()

        ttk.Button(deck_window, text="Save Deck", command=save_deck).pack(pady=10)

        # Pack the canvas and scrollbar
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")

    def compress_pack(self, folder_path, output_path):
        # Create a temporary working directory
        with tempfile.TemporaryDirectory() as temp_dir:
            # Copy the entire pack structure to the temp directory
            temp_pack_dir = os.path.join(temp_dir, os.path.basename(folder_path))
            shutil.copytree(folder_path, temp_pack_dir)
            
            # Process deck folder
            deck_path = os.path.join(temp_pack_dir, "deck")
            for file in os.listdir(deck_path):
                if file.endswith(".json"):
                    file_path = os.path.join(deck_path, file)
                    self.shift_bits(file_path, shift_up=True)
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
                    os.rename(file_path, file_path[:-4] + ".gci")
            
            with zipfile.ZipFile(os.path.join(temp_pack_dir, "image.gcip"), 'w') as zipf:
                for root, _, files in os.walk(image_path):
                    for file in files:
                        zipf.write(os.path.join(root, file), file)
            
            # Delete temporary deck and image folders
            shutil.rmtree(deck_path)
            shutil.rmtree(image_path)
            
            # Create final ZIP archive
            with zipfile.ZipFile(output_path, 'w') as zipf:
                zipf.write(os.path.join(temp_pack_dir, "info.json"), "info.json")
                zipf.write(os.path.join(temp_pack_dir, "deck.gcdp"), "deck.gcdp")
                zipf.write(os.path.join(temp_pack_dir, "image.gcip"), "image.gcip")

    def shift_bits(self, file_path, shift_up=True):
        with open(file_path, 'rb') as file:
            data = bytearray(file.read())
        
        for i in range(len(data)):
            if shift_up:
                data[i] = (data[i] << 1) & 255
            else:
                data[i] = (data[i] >> 1) & 255
        
        with open(file_path, 'wb') as file:
            file.write(data)

if __name__ == "__main__":
    root = tk.Tk()
    app = GCPStudio(root)
    root.mainloop()