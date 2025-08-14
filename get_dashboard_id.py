#!/usr/bin/env python3
"""
Script to get the dashboard ID from Superset and update the backend configuration
"""

import requests
import re
import time

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

def get_dashboard_id(session):
    """Get the Brand Dashboard ID"""
    dashboard_list_url = f"{SUPERSET_URL}/dashboard/list/"
    response = session.get(dashboard_list_url)
    
    # Look for the Brand Dashboard
    if 'Brand Dashboard' in response.text:
        # Extract the dashboard ID from the URL
        match = re.search(r'href="/dashboard/edit/(\d+)"[^>]*>Brand Dashboard', response.text)
        if match:
            dashboard_id = match.group(1)
            print(f"✅ Found Brand Dashboard with ID: {dashboard_id}")
            return dashboard_id
    
    print("❌ Brand Dashboard not found")
    return None

def update_backend_config(dashboard_id):
    """Update the backend configuration with the correct dashboard ID"""
    if not dashboard_id:
        print("⚠️ No dashboard ID to update backend config")
        return
    
    # Update the ReportController.java file
    controller_file = "backend/src/main/java/com/branddashboard/controller/ReportController.java"
    
    try:
        with open(controller_file, 'r') as f:
            content = f.read()
        
        # Replace the hardcoded dashboard ID
        new_content = content.replace(
            'private static final String SUPERSET_DASHBOARD_ID = "1";',
            f'private static final String SUPERSET_DASHBOARD_ID = "{dashboard_id}";'
        )
        
        with open(controller_file, 'w') as f:
            f.write(new_content)
        
        print(f"✅ Updated backend configuration with dashboard ID: {dashboard_id}")
        print("🔄 You'll need to restart the backend container for changes to take effect")
        
    except Exception as e:
        print(f"❌ Failed to update backend configuration: {e}")

def main():
    print("🔍 Getting dashboard ID from Superset...")
    
    # Wait for Superset to be ready
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
    
    # Get dashboard ID
    dashboard_id = get_dashboard_id(session)
    if not dashboard_id:
        return
    
    # Update backend configuration
    update_backend_config(dashboard_id)
    
    print("\n🎉 Configuration updated!")
    print("Next steps:")
    print("1. Restart the backend container")
    print("2. Test the embedded dashboard in your frontend")

if __name__ == "__main__":
    main()
