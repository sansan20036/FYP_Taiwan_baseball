import tkinter as tk
from tkinter import ttk, messagebox
from crawler import crawler  # Assumes you have a 'crawler' function in crawler.py

# Global variables
selected_option = ""
url = ""
file_name = ""

# Map options to URLs and file names
option_map = {
    "cpbl": ("https://www.cpbl.com.tw/", "cpbl_html_files"),
    "cpbl_player": ("https://www.cpbl.com.tw/schedule", "cpbl_player_html_files"),
    "fandom": ("https://fandom.com", "fandom_html_files")
}

# Handle selection change in combo box
def on_selection(event):
    global selected_option, url, file_name
    selected_option = combo_box.get()

    if selected_option in option_map:
        url, file_name = option_map[selected_option]
        status_label.config(text=f"Selected Website: {selected_option}")
    else:
        url, file_name = "", ""
        status_label.config(text="Invalid selection")

# Start crawler
def run_crawler():
    if not url or not file_name:
        messagebox.showerror("Error", "Please select a valid website option.")
        return

    print(f"Starting crawler for {selected_option}...")
    crawler(url, file_name)
    messagebox.showinfo("Success", f"Crawling completed and saved to: {file_name}")

# Main GUI
root = tk.Tk()
root.title("Web Crawler Launcher")

# GUI Layout
tk.Label(root, text="Select Website to Crawl:", font=("Arial", 12)).pack(pady=10)

combo_box = ttk.Combobox(root, values=list(option_map.keys()), state="readonly")
combo_box.set("cpbl")  # Default value
combo_box.pack(pady=5)
combo_box.bind("<<ComboboxSelected>>", on_selection)

status_label = tk.Label(root, text="Selected Website: cpbl", font=("Arial", 10))
status_label.pack(pady=5)

start_button = tk.Button(root, text="Start Crawler", width=25, command=run_crawler)
start_button.pack(pady=10)

# Start with default selected
selected_option = "cpbl"
url, file_name = option_map[selected_option]

root.mainloop()
