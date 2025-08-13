#!/usr/bin/env python3
"""
Script to set up MongoDB database connection in Superset via Trino
Run this after Superset is up and running
"""

import requests
import json
import time
from urllib.parse import urljoin

# Superset configuration
SUPERSET_URL = "http://localhost:8088"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin"

def login_to_superset():
    """Login to Superset and get session cookies"""
    login_url = urljoin(SUPERSET_URL, "/login/")
    
    # Get CSRF token
    session = requests.Session()
    response = session.get(login_url)
    
    # Extract CSRF token from the login page
    # This is a simplified approach - in production you might need more robust parsing
    csrf_token = None
    if 'csrf_token' in response.text:
        # Extract CSrf token from the response
        import re
        match = re.search(r'name="csrf_token" value="([^"]+)"', response.text)
        if match:
            csrf_token = match.group(1)
    
    # Login
    login_data = {
        'username': ADMIN_USERNAME,
        'password': ADMIN_PASSWORD,
        'csrf_token': csrf_token
    }
    
    response = session.post(login_url, data=login_data)
    
    if response.status_code == 200 and 'dashboard' in response.url:
        print("✅ Successfully logged in to Superset")
        return session
    else:
        print("❌ Failed to login to Superset")
        print(f"Status code: {response.status_code}")
        print(f"Response URL: {response.url}")
        return None

def add_database_connection(session):
    """Add MongoDB database connection via Trino"""
    db_url = urljoin(SUPERSET_URL, "/databaseview/add")
    
    # Get CSRF token for database creation
    response = session.get(db_url)
    csrf_token = None
    if 'csrf_token' in response.text:
        import re
        match = re.search(r'name="csrf_token" value="([^"]+)"', response.text)
        if match:
            csrf_token = match.group(1)
    
    # Database connection data
    db_data = {
        'database_name': 'MongoDB via Trino',
        'sqlalchemy_uri': 'trino://trino:8080/mongodb/default',
        'engine': 'trino',
        'extra': json.dumps({
            'engine_params': {
                'connect_args': {
                    'host': 'trino',
                    'port': 8080,
                    'catalog': 'mongodb',
                    'schema': 'default',
                    'user': 'admin'
                }
            }
        }),
        'csrf_token': csrf_token
    }
    
    response = session.post(db_url, data=db_data)
    
    if response.status_code == 302:  # Redirect usually means success
        print("✅ Successfully added MongoDB database connection")
        return True
    else:
        print("❌ Failed to add database connection")
        print(f"Status code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        return False

def main():
    print("🚀 Setting up MongoDB connection in Superset...")
    
    # Wait for Superset to be ready
    print("⏳ Waiting for Superset to be ready...")
    max_retries = 30
    for i in range(max_retries):
        try:
            response = requests.get(SUPERSET_URL, timeout=5)
            if response.status_code == 200:
                print("✅ Superset is ready!")
                break
        except requests.exceptions.RequestException:
            pass
        
        if i < max_retries - 1:
            print(f"⏳ Attempt {i+1}/{max_retries} - waiting...")
            time.sleep(2)
        else:
            print("❌ Superset is not responding after maximum retries")
            return
    
    # Login to Superset
    session = login_to_superset()
    if not session:
        return
    
    # Add database connection
    success = add_database_connection(session)
    
    if success:
        print("\n🎉 Setup complete!")
        print("You should now see 'MongoDB via Trino' in your database list")
        print("When creating a dataset, select 'MongoDB via Trino' as the database")
        print("and 'mongodb' should appear as an available schema")
    else:
        print("\n❌ Setup failed. Please check the error messages above")

if __name__ == "__main__":
    main()
