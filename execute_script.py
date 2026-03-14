#!/usr/bin/env python3
"""Execute the create_structure_master.py script and capture output"""

import subprocess
import sys
import os

# Change to the IMS directory
os.chdir(r"C:\Users\shrus\OneDrive\Desktop\IMS")

# Run the script
result = subprocess.run(
    [sys.executable, "create_structure_master.py"],
    capture_output=False,
    text=True
)

sys.exit(result.returncode)
