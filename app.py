#!/usr/bin/env python3
"""
JurisAI Legal Education Platform - Hugging Face Spaces Deployment
"""

import os
import subprocess
import sys
from pathlib import Path

def install_dependencies():
    """Install required dependencies"""
    print("Installing dependencies...")
    subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)

def build_nextjs():
    """Build Next.js application"""
    print("Building Next.js application...")
    subprocess.run(["npm", "run", "build"], check=True)

def start_nextjs():
    """Start Next.js application in production mode"""
    print("Starting Next.js application...")
    os.environ["NODE_ENV"] = "production"
    os.environ["PORT"] = "7860"  # Hugging Face Spaces port
    subprocess.run(["npm", "start"])

if __name__ == "__main__":
    try:
        # Change to the project directory
        os.chdir(os.path.dirname(os.path.abspath(__file__)))
        
        # Install dependencies
        install_dependencies()
        
        # Build the application
        build_nextjs()
        
        # Start the application
        start_nextjs()
        
    except subprocess.CalledProcessError as e:
        print(f"Error: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\nShutting down...")
        sys.exit(0)
