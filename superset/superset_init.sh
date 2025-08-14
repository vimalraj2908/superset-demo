#!/bin/bash

# Install required packages first
echo "Installing required packages..."
pip install trino sqlalchemy-trino requests

# Run database migrations
echo "Running database migrations..."
superset db upgrade

# Create admin user if it doesn't exist
echo "Creating admin user..."
superset fab create-admin \
    --username admin \
    --firstname Superset \
    --lastname Admin \
    --email admin@superset.com \
    --password admin

# Initialize Superset
echo "Initializing Superset..."
superset init

# Start Superset in the background
echo "Starting Superset in background..."
superset run -p 8088 -h 0.0.0.0 &
SUPERSET_PID=$!

# Wait for Superset to be ready
echo "Waiting for Superset to be ready..."
until curl -s http://localhost:8088 > /dev/null; do
    echo "Waiting for Superset..."
    sleep 5
done

echo "Superset is ready!"

# Wait a bit more for Superset to be fully ready
sleep 10

# Create a Python script to set up the dashboard
cat > /tmp/setup_dashboard.py << 'EOF'
#!/usr/bin/env python3
import requests
import json
import time
import re
from urllib.parse import urljoin

SUPERSET_URL = "http://localhost:8088"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin"

def login_to_superset():
    """Login to Superset and get session cookies"""
    session = requests.Session()
    
    # Get login page to extract CSRF token
    response = session.get(f"{SUPERSET_URL}/login/")
    
    # Extract CSRF token
    csrf_token = None
    if 'csrf_token' in response.text:
        match = re.search(r'name="csrf_token" value="([^"]+)"', response.text)
        if match:
            csrf_token = match.group(1)
    
    # Login
    login_data = {
        'username': ADMIN_USERNAME,
        'password': ADMIN_PASSWORD,
        'csrf_token': csrf_token
    }
    
    response = session.post(f"{SUPERSET_URL}/login/", data=login_data)
    
    if response.status_code == 200 and 'dashboard' in response.url:
        print("✅ Successfully logged in to Superset")
        return session
    else:
        print("❌ Failed to login to Superset")
        return None

def check_database_exists(session):
    """Check if MongoDB database connection already exists"""
    db_list_url = f"{SUPERSET_URL}/databaseview/list/"
    response = session.get(db_list_url)
    
    if 'MongoDB via Trino' in response.text:
        print("✅ MongoDB database connection already exists")
        return True
    return False

def add_database_connection(session):
    """Add MongoDB database connection via Trino"""
    if check_database_exists(session):
        return True
        
    db_url = f"{SUPERSET_URL}/databaseview/add"
    response = session.get(db_url)
    
    csrf_token = None
    if 'csrf_token' in response.text:
        match = re.search(r'name="csrf_token" value="([^"]+)"', response.text)
        if match:
            csrf_token = match.group(1)
    
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
    
    if response.status_code == 302:
        print("✅ Successfully added MongoDB database connection")
        return True
    else:
        print("❌ Failed to add database connection")
        return False

def check_dashboard_exists(session):
    """Check if Brand Dashboard already exists"""
    dashboard_list_url = f"{SUPERSET_URL}/dashboard/list/"
    response = session.get(dashboard_list_url)
    
    if 'Brand Dashboard' in response.text:
        print("✅ Brand Dashboard already exists")
        return True
    return False

def create_dashboard(session):
    """Create Brand Dashboard if it doesn't exist"""
    if check_dashboard_exists(session):
        return True
        
    dashboard_url = f"{SUPERSET_URL}/dashboard/add"
    response = session.get(dashboard_url)
    
    csrf_token = None
    if 'csrf_token' in response.text:
        match = re.search(r'name="csrf_token" value="([^"]+)"', response.text)
        if match:
            csrf_token = match.group(1)
    
    dashboard_data = {
        'dashboard_title': 'Brand Dashboard',
        'slug': 'brand-dashboard',
        'css': '',
        'csrf_token': csrf_token
    }
    
    response = session.post(dashboard_url, data=dashboard_data)
    
    if response.status_code == 302:
        print("✅ Successfully created Brand Dashboard")
        return True
    else:
        print("❌ Failed to create dashboard")
        return False

def main():
    print("🚀 Setting up Superset dashboard...")
    
    # Login to Superset
    session = login_to_superset()
    if not session:
        print("❌ Could not login to Superset")
        return
    
    # Add database connection
    if not add_database_connection(session):
        print("❌ Could not add database connection")
        return
    
    # Create dashboard
    if not create_dashboard(session):
        print("❌ Could not create dashboard")
        return
    
    print("🎉 Superset setup complete!")

if __name__ == "__main__":
    main()
EOF

# Run the dashboard setup script
echo "Setting up dashboard..."
python3 /tmp/setup_dashboard.py

# Keep the script running and wait for the Superset process
echo "Superset is running. Waiting for process..."
wait $SUPERSET_PID
