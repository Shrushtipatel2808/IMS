#!/usr/bin/env python3
import subprocess
import sys
import os

os.chdir(r"C:\Users\shrus\OneDrive\Desktop\IMS")
result = subprocess.run([sys.executable, "create_structure_master.py"], capture_output=False, text=True)
sys.exit(result.returncode)
