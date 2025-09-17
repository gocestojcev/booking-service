#!/usr/bin/env python3
"""
Test script to check if the Lambda function can import the modules
"""

import sys
import os

# Add the current directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    print("Testing imports...")
    
    # Test basic imports
    print("1. Testing boto3 import...")
    import boto3
    print("   ✅ boto3 imported successfully")
    
    print("2. Testing FastAPI import...")
    import fastapi
    print("   ✅ FastAPI imported successfully")
    
    print("3. Testing mangum import...")
    import mangum
    print("   ✅ Mangum imported successfully")
    
    print("4. Testing src.booking_system import...")
    from src.booking_system.api.v1.main import app
    print("   ✅ Main app imported successfully")
    
    print("5. Testing Lambda handler...")
    from lambda_handler import handler
    print("   ✅ Lambda handler imported successfully")
    
    print("\n✅ All imports successful!")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    print(f"   Current working directory: {os.getcwd()}")
    print(f"   Python path: {sys.path}")
except Exception as e:
    print(f"❌ Unexpected error: {e}")
    import traceback
    traceback.print_exc()
