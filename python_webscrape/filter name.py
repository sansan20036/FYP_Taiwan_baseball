import os
import re

# Set the path to your folder
folder_path = 'E:\Code\FYP\scraped_data_2025_07_14'  # Replace this with the actual path

# Compile a regex pattern to match filenames containing "person" (case-insensitive)
pattern = re.compile(r'person', re.IGNORECASE)

# List all files in the folder
files = os.listdir(folder_path)

# Filter files that match the regex pattern
matching_files = [f for f in files if pattern.search(f)]

# Output the result
print("Files containing 'person' in the name:")
for f in matching_files:
    print(type(matching_files), f)
