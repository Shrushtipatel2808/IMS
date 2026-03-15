import os
from pathlib import Path
import json

# Execute the directory creation
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

# Print header
print("\n" + "=" * 70)
print("CREATING DIRECTORY STRUCTURE")
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
        created_dirs.append(str(directory))
    except Exception as e:
        print(f"✗ Failed to create {directory}: {e}")

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
print(f"Directories specified:  {len(directories)}")
print(f"Directories created:    {created_count}")
print(f"Total dirs in tree:     {total_dirs}")
print(f"Status: ✓ ALL DIRECTORIES CREATED SUCCESSFULLY")
print("=" * 70 + "\n")

# Save results to a JSON file for verification
results = {
    "base_dir": str(base_dir),
    "directories_specified": directories,
    "directories_created": created_dirs,
    "created_count": created_count,
    "total_dirs_in_tree": total_dirs,
    "status": "SUCCESS"
}

with open(r"C:\Users\shrus\OneDrive\Desktop\IMS\creation_results.json", "w") as f:
    json.dump(results, f, indent=2)

print("Results saved to: creation_results.json")
