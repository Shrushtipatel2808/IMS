#!/usr/bin/env python3
"""
MASTER DIRECTORY STRUCTURE CREATOR FOR IMS PROJECT
===================================================
This is the definitive script that creates all directories and shows output.

Run from any directory:
  python create_structure_master.py
  
Or from the IMS directory:
  cd C:\Users\shrus\OneDrive\Desktop\IMS
  python create_structure_master.py
r"""

import os
import sys
from pathlib import Path
from datetime import datetime

def main():
    # Target base directory
    base_dir = Path(r"C:\Users\shrus\OneDrive\Desktop\IMS")
    
    # Complete list of directories to create
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
    
    # Start output
    output_buffer = []
    
    output_buffer.append("")
    output_buffer.append("=" * 70)
    output_buffer.append("IMS PROJECT DIRECTORY STRUCTURE CREATOR")
    output_buffer.append("=" * 70)
    output_buffer.append(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    output_buffer.append(f"Base Directory: {base_dir}")
    output_buffer.append("")
    output_buffer.append("CREATING DIRECTORIES:")
    output_buffer.append("-" * 70)
    
    # Create all directories
    created_count = 0
    failed_count = 0
    
    for idx, directory in enumerate(directories, 1):
        full_path = base_dir / directory
        try:
            full_path.mkdir(parents=True, exist_ok=True)
            # Verify it was created
            if full_path.exists() and full_path.is_dir():
                output_buffer.append(f"  {idx:2d}. ✓ Created: {directory}")
                created_count += 1
            else:
                output_buffer.append(f"  {idx:2d}. ✗ Failed: {directory} (path exists but is not directory)")
                failed_count += 1
        except Exception as e:
            output_buffer.append(f"  {idx:2d}. ✗ Failed: {directory}")
            output_buffer.append(f"         Error: {str(e)}")
            failed_count += 1
    
    output_buffer.append("-" * 70)
    output_buffer.append("")
    
    # Verification - walk and count directories
    output_buffer.append("VERIFYING DIRECTORY STRUCTURE:")
    output_buffer.append("-" * 70)
    output_buffer.append("")
    
    def print_tree_to_buffer(path, prefix="", is_last=True):
        """Build tree structure and return lines"""
        lines = []
        dir_count = 0
        
        try:
            # Get all subdirectories, sorted
            items = sorted([item for item in os.listdir(str(path)) 
                           if os.path.isdir(os.path.join(str(path), item))
                           and not item.startswith('.')])
            
            for i, item in enumerate(items):
                is_last_item = (i == len(items) - 1)
                current_prefix = "└── " if is_last_item else "├── "
                lines.append(f"{prefix}{current_prefix}{item}/")
                dir_count += 1
                
                # Recursively get subdirectories
                next_prefix = prefix + ("    " if is_last_item else "│   ")
                item_path = os.path.join(str(path), item)
                sub_lines, sub_count = print_tree_to_buffer(item_path, next_prefix, is_last_item)
                lines.extend(sub_lines)
                dir_count += sub_count
                
        except (PermissionError, OSError):
            pass
        
        return lines, dir_count
    
    # Build the tree
    output_buffer.append(f"{base_dir.name}/")
    tree_lines, total_dirs = print_tree_to_buffer(str(base_dir))
    output_buffer.extend(tree_lines)
    
    output_buffer.append("")
    output_buffer.append("=" * 70)
    output_buffer.append("SUMMARY")
    output_buffer.append("=" * 70)
    output_buffer.append(f"Total directories specified:    {len(directories)}")
    output_buffer.append(f"Directories created:            {created_count}")
    output_buffer.append(f"Directories failed:             {failed_count}")
    output_buffer.append(f"Total directories in tree:      {total_dirs}")
    output_buffer.append("")
    
    if failed_count == 0 and created_count == len(directories):
        output_buffer.append(f"✓ SUCCESS: All {len(directories)} directories created successfully!")
    elif created_count > 0:
        output_buffer.append(f"⚠ PARTIAL SUCCESS: {created_count} of {len(directories)} directories created")
    else:
        output_buffer.append("✗ FAILED: No directories were created")
    
    output_buffer.append("=" * 70)
    output_buffer.append("")
    
    # Print and return
    output_text = "\n".join(output_buffer)
    print(output_text)
    
    # Also save to a text file
    try:
        output_file = base_dir / "creation_output.txt"
        with open(str(output_file), "w", encoding="utf-8") as f:
            f.write(output_text)
        print(f"Output saved to: {output_file}")
    except Exception as e:
        print(f"Could not save output file: {str(e)}")
    
    return failed_count == 0

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠ Operation cancelled by user.")
        sys.exit(130)
    except Exception as e:
        print(f"\n✗ CRITICAL ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
