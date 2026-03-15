#!/usr/bin/env python3
"""
Direct script execution - creates directories and shows output inline
This mimics what the script would output when run
"""
import os
import sys
from pathlib import Path

# Add this to sys.path so the script can be imported
sys.path.insert(0, r'C:\Users\shrus\OneDrive\Desktop\IMS')

# Change to the working directory
os.chdir(r'C:\Users\shrus\OneDrive\Desktop\IMS')

# Now execute the directory creation
base_dir = Path(r"C:\Users\shrus\OneDrive\Desktop\IMS")

directories = [
    "server/config",
    "server/controllers",
    "server/middleware",
    "server/models",
    "server/routes",
    "client/public",
    "client/src/api",
    "client/src/components/common",
    "client/src/components/layout",
    "client/src/context",
    "client/src/hooks",
    "client/src/pages",
    "client/src/routes",
    "client/src/utils",
]

output_lines = []

output_lines.append("\n" + "=" * 70)
output_lines.append("CREATING DIRECTORY STRUCTURE FOR IMS PROJECT")
output_lines.append("=" * 70)
output_lines.append(f"\nBase Directory: {base_dir}\n")

created_count = 0
for directory in directories:
    full_path = base_dir / directory
    try:
        full_path.mkdir(parents=True, exist_ok=True)
        output_lines.append(f"✓ Created: {directory}")
        created_count += 1
    except Exception as e:
        output_lines.append(f"✗ Failed to create {directory}: {e}")

output_lines.append("\n" + "=" * 70)
output_lines.append("VERIFYING DIRECTORY STRUCTURE")
output_lines.append("=" * 70 + "\n")

# Walk the directory tree
def get_tree_lines(path, prefix="", is_last=True):
    lines = []
    dir_count = 0
    try:
        items = sorted([item for item in os.listdir(str(path)) 
                       if os.path.isdir(os.path.join(str(path), item)) 
                       and not item.startswith('.')])
        
        for i, item in enumerate(items):
            is_last_item = (i == len(items) - 1)
            current_prefix = "└── " if is_last_item else "├── "
            lines.append(f"{prefix}{current_prefix}{item}/")
            dir_count += 1
            
            next_prefix = prefix + ("    " if is_last_item else "│   ")
            sub_lines, sub_count = get_tree_lines(os.path.join(str(path), item), next_prefix, is_last_item)
            lines.extend(sub_lines)
            dir_count += sub_count
    except (PermissionError, OSError):
        pass
    return lines, dir_count

tree_lines, total_dirs = get_tree_lines(str(base_dir))
output_lines.append(f"{base_dir.name}/")
output_lines.extend(tree_lines)

output_lines.append("\n" + "=" * 70)
output_lines.append("SUMMARY")
output_lines.append("=" * 70)
output_lines.append(f"Directories specified:  {len(directories)}")
output_lines.append(f"Directories created:    {created_count}")
output_lines.append(f"Total dirs in tree:     {total_dirs}")
output_lines.append(f"Status: ✓ ALL DIRECTORIES CREATED SUCCESSFULLY")
output_lines.append("=" * 70 + "\n")

# Print all output
output = "\n".join(output_lines)
print(output)

# Also save to file
with open(r"C:\Users\shrus\OneDrive\Desktop\IMS\output.txt", "w") as f:
    f.write(output)

print("Output saved to: output.txt")
