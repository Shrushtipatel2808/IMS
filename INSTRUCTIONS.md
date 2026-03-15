"""
==================================================================================
IMS PROJECT DIRECTORY STRUCTURE CREATOR
==================================================================================

This Python script will create the complete directory structure for an 
Inventory Management System (IMS) project.

PROJECT STRUCTURE:
==================

IMS/
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   └── routes/
└── client/
    ├── public/
    └── src/
        ├── api/
        ├── components/
        │   ├── common/
        │   └── layout/
        ├── context/
        ├── hooks/
        ├── pages/
        ├── routes/
        └── utils/

==================================================================================
HOW TO RUN THIS SCRIPT:
==================================================================================

1. From Command Prompt:
   cd C:\Users\shrus\OneDrive\Desktop\IMS
   python create_structure_final.py

2. From PowerShell:
   cd C:\Users\shrus\OneDrive\Desktop\IMS
   python create_structure_final.py
   
   OR
   
   & 'C:\Users\shrus\OneDrive\Desktop\IMS\create_structure_final.py'

3. By double-clicking the .py file (may not show output)

4. Using the batch file (creates and runs):
   run_script.bat

==================================================================================
SCRIPT DETAILS:
==================================================================================
"""

import os
import sys
from pathlib import Path

def main():
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
    
    print("\n" + "=" * 70)
    print("CREATING DIRECTORY STRUCTURE FOR IMS PROJECT")
    print("=" * 70)
    print(f"\nBase Directory: {base_dir}\n")
    
    # Create all directories
    created_count = 0
    created_dirs = []
    
    for directory in directories:
        full_path = base_dir / directory
        try:
            full_path.mkdir(parents=True, exist_ok=True)
            print(f"✓ Created: {directory}")
            created_count += 1
            created_dirs.append(directory)
        except Exception as e:
            print(f"✗ Failed to create {directory}: {str(e)}")
            return False
    
    print("\n" + "=" * 70)
    print("VERIFYING DIRECTORY STRUCTURE")
    print("=" * 70 + "\n")
    
    # Walk the directory tree and display hierarchy
    def print_tree(path, prefix="", is_last=True):
        """Print directory tree structure"""
        dir_count = 0
        
        try:
            # Get all subdirectories (excluding hidden files)
            items = sorted([item for item in os.listdir(str(path)) 
                           if os.path.isdir(os.path.join(str(path), item)) 
                           and not item.startswith('.')])
            
            for i, item in enumerate(items):
                is_last_item = (i == len(items) - 1)
                current_prefix = "└── " if is_last_item else "├── "
                print(f"{prefix}{current_prefix}{item}/")
                dir_count += 1
                
                # Recursive call for subdirectories
                next_prefix = prefix + ("    " if is_last_item else "│   ")
                item_path = os.path.join(str(path), item)
                sub_count = print_tree(item_path, next_prefix, is_last_item)
                dir_count += sub_count
                
        except (PermissionError, OSError) as e:
            pass
        
        return dir_count
    
    # Print tree starting from base
    print(f"{base_dir.name}/")
    total_dirs = print_tree(str(base_dir))
    
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Directories specified:  {len(directories)}")
    print(f"Directories created:    {created_count}")
    print(f"Total directories found in tree: {total_dirs}")
    
    if created_count == len(directories):
        print(f"\n✓ SUCCESS: All {len(directories)} directories created successfully!")
    else:
        print(f"\n⚠ WARNING: Only {created_count} of {len(directories)} directories were created")
    
    print("=" * 70 + "\n")
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nOperation cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
