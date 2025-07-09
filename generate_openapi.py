#!/usr/bin/env python3
"""
Generate OpenAPI specification for Postman import.
Run with: python generate_openapi.py
"""

import json
from backend.app.api.main import app

def generate_openapi_spec():
    """Generate and save OpenAPI specification to file."""
    
    # Get the OpenAPI schema
    openapi_schema = app.openapi()
    
    # Write to file
    with open('openapi.json', 'w') as f:
        json.dump(openapi_schema, f, indent=2)
    
    print("✅ OpenAPI specification generated successfully!")
    print("📁 File: openapi.json")
    print("📋 Import into Postman:")
    print("   1. Open Postman")
    print("   2. Click 'Import'")
    print("   3. Select 'Upload Files'")
    print("   4. Choose the openapi.json file")
    print("   5. Click 'Import'")
    print()
    print("🌐 Or import directly from running server:")
    print("   URL: http://localhost:8000/openapi.json")
    print()
    print("📖 Interactive docs: http://localhost:8000/docs")

if __name__ == "__main__":
    generate_openapi_spec()