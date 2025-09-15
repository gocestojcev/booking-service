import os
from mangum import Mangum

# Try to load environment variables from .env file if available
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("Successfully loaded .env file")
except ImportError:
    print("python-dotenv not available, skipping .env file loading")
except Exception as e:
    print(f"Error loading .env file: {e}")

# Ensure the path is correct for Lambda
# Lambda's working directory is /var/task, and our code is in src/booking_system/api/v1/main.py
# We need to ensure Python can find the modules.
# For a zip deployment, the root of the zip is /var/task.
# If src/ is at the root of the zip, then the import path is correct.

# The actual FastAPI app is located at src/booking_system/api/v1/main.py
# When packaged for Lambda, the 'src' directory will be at the root of the zip.
# So, the import path should be relative to the zip root.
# Assuming 'src' is at the root of the zip, the import should be:
from src.booking_system.api.v1.main import app

handler = Mangum(app)
