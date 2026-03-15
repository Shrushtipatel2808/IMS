#!/usr/bin/env python3
import os
import sys
from pathlib import Path

# Ensure script can be run from anywhere
os.chdir(r"C:\Users\shrus\OneDrive\Desktop\IMS")

# Base directory
base_dir = Path(r"C:\Users\shrus\OneDrive\Desktop\IMS")

# List of directories to create
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

print("=" * 70)
print("CREATING DIRECTORY STRUCTURE")
print("=" * 70)
print(f"\nBase Directory: {base_dir}\n")

# Create all directories
created_count = 0
for directory in directories:
    full_path = base_dir / directory
    try:
        full_path.mkdir(parents=True, exist_ok=True)
        print(f"✓ Created: {directory}")
        created_count += 1
    except Exception as e:
        print(f"✗ Failed to create {directory}: {e}")
        sys.exit(1)

print("\n" + "=" * 70)
print("VERIFYING DIRECTORY STRUCTURE")
print("=" * 70 + "\n")

# Walk the directory tree and display hierarchy
def print_tree(path, prefix="", is_last=True):
    """Print directory tree structure"""
    dir_count = 0
    
    try:
        items = sorted([item for item in os.listdir(path) 
                       if os.path.isdir(os.path.join(path, item))])
        
        for i, item in enumerate(items):
            is_last_item = (i == len(items) - 1)
            current_prefix = "└── " if is_last_item else "├── "
            print(f"{prefix}{current_prefix}{item}/")
            dir_count += 1
            
            # Recursive call for subdirectories
            next_prefix = prefix + ("    " if is_last_item else "│   ")
            sub_count = print_tree(os.path.join(path, item), next_prefix, is_last_item)
            dir_count += sub_count
            
    except PermissionError:
        pass
    
    return dir_count

print(f"{base_dir.name}/")
total_dirs = print_tree(str(base_dir))

print("\n" + "=" * 70)
print("SUMMARY")
print("=" * 70)
print(f"Directories to create:  {len(directories)}")
print(f"Directories created:    {created_count}")
print(f"Total dirs in tree:     {total_dirs}")
print(f"Status: ✓ ALL DIRECTORIES CREATED SUCCESSFULLY")
print("=" * 70)
