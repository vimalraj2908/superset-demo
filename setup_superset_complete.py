#!/usr/bin/env python3
"""
Complete Superset setup script for embedded dashboards
"""

import requests
import json
import time
import re
import sys

SUPERSET_URL = "http://localhost:8088"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin"

def wait_for_superset():
    """Wait for Superset to be ready"""
    print("🔄 Waiting for Superset to be ready...")
    max_retries = 60
    for i in range(max_retries):
        try:
            response = requests.get(f"{SUPERSET_URL}/health", timeout=5)
            if response.status_code == 200:
                print("✅ Superset is ready!")
                time.sleep(5)  # Give it a bit more time
                return True
        except requests.exceptions.RequestException:
            pass
        
        if i < max_retries - 1:
            print(f"⏳ Attempt {i+1}/{max_retries} - waiting...")
            time.sleep(2)
    
    print("❌ Superset is not responding after maximum retries")
    return False

def login_to_superset():
    """Login to Superset and get session cookies"""
    session = requests.Session()
    
    try:
        # Get login page
        response = session.get(f"{SUPERSET_URL}/login/")
        
        # Try modern login API first
        login_data = {
            'username': ADMIN_USERNAME,
            'password': ADMIN_PASSWORD,
            'provider': 'db',
            'refresh': True
        }
        
        response = session.post(f"{SUPERSET_URL}/api/v1/security/login", json=login_data)
        
        if response.status_code == 200:
            result = response.json()
            if 'access_token' in result:
                # Add the token to headers for API calls
                session.headers.update({
                    'Authorization': f'Bearer {result["access_token"]}',
                    'Content-Type': 'application/json'
                })
                print("✅ Successfully logged in to Superset (API)")
                return session
        
        # Fallback to form-based login
        response = session.get(f"{SUPERSET_URL}/login/")
        csrf_token = None
        if 'csrf_token' in response.text:
            match = re.search(r'name="csrf_token" value="([^"]+)"', response.text)
            if match:
                csrf_token = match.group(1)
        
        login_data = {
            'username': ADMIN_USERNAME,
            'password': ADMIN_PASSWORD,
            'csrf_token': csrf_token
        }
        
        response = session.post(f"{SUPERSET_URL}/login/", data=login_data)
        
        if response.status_code == 200:
            print("✅ Successfully logged in to Superset (Form)")
            return session
        else:
            print(f"❌ Failed to login to Superset: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Error during login: {e}")
        return None

def create_guest_role(session):
    """Create Guest role if it doesn't exist"""
    try:
        # Check if Guest role exists
        response = session.get(f"{SUPERSET_URL}/api/v1/security/roles")
        if response.status_code == 200:
            roles = response.json().get('result', [])
            for role in roles:
                if role.get('name') == 'Guest':
                    print("✅ Guest role already exists")
                    return True
        
        # Create Guest role
        role_data = {
            'name': 'Guest',
            'permissions': [
                {'permission_name': 'can_read', 'view_menu_name': 'Dashboard'},
                {'permission_name': 'can_read', 'view_menu_name': 'Chart'},
                {'permission_name': 'can_read', 'view_menu_name': 'Dataset'},
            ]
        }
        
        response = session.post(f"{SUPERSET_URL}/api/v1/security/roles", json=role_data)
        if response.status_code in [200, 201]:
            print("✅ Created Guest role")
            return True
        else:
            print(f"⚠️ Could not create Guest role: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"⚠️ Error creating Guest role: {e}")
        return False

def add_database_connection(session):
    """Add MongoDB database connection via Trino"""
    try:
        # Check if database already exists
        response = session.get(f"{SUPERSET_URL}/api/v1/database")
        if response.status_code == 200:
            databases = response.json().get('result', [])
            for db in databases:
                if 'MongoDB via Trino' in db.get('database_name', ''):
                    print("✅ MongoDB database connection already exists")
                    return True
        
        # Create database connection
        db_data = {
            'database_name': 'MongoDB via Trino',
            'sqlalchemy_uri': 'trino://trino:8080/mongodb/default',
            'configuration_method': 'sqlalchemy_form',
            'expose_in_sqllab': True,
            'allow_run_async': True,
            'allow_csv_upload': False,
            'allow_ctas': False,
            'allow_cvas': False,
            'allow_dml': False,
            'force_ctas_schema': '',
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
            })
        }
        
        response = session.post(f"{SUPERSET_URL}/api/v1/database", json=db_data)
        
        if response.status_code in [200, 201]:
            print("✅ Successfully added MongoDB database connection")
            return True
        else:
            print(f"⚠️ Failed to add database connection: {response.status_code}")
            if response.text:
                print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error adding database: {e}")
        return False

def create_sample_dashboard(session):
    """Create a sample dashboard"""
    try:
        # Check if dashboard already exists
        response = session.get(f"{SUPERSET_URL}/api/v1/dashboard")
        if response.status_code == 200:
            dashboards = response.json().get('result', [])
            for dashboard in dashboards:
                if dashboard.get('dashboard_title') == 'Brand Dashboard':
                    print(f"✅ Brand Dashboard already exists with ID: {dashboard.get('id')}")
                    return dashboard.get('id')
        
        # Create dashboard
        dashboard_data = {
            'dashboard_title': 'Brand Dashboard',
            'slug': 'brand-dashboard',
            'published': True,
            'css': '',
            'json_metadata': json.dumps({
                'timed_refresh_immune_slices': [],
                'expanded_slices': {},
                'refresh_frequency': 0,
                'default_filters': json.dumps({})
            })
        }
        
        response = session.post(f"{SUPERSET_URL}/api/v1/dashboard", json=dashboard_data)
        
        if response.status_code in [200, 201]:
            dashboard_id = response.json().get('id')
            print(f"✅ Successfully created Brand Dashboard with ID: {dashboard_id}")
            return dashboard_id
        else:
            print(f"⚠️ Failed to create dashboard: {response.status_code}")
            if response.text:
                print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error creating dashboard: {e}")
        return None

def update_backend_config(dashboard_id):
    """Update the backend configuration with the correct dashboard ID"""
    if not dashboard_id:
        print("⚠️ No dashboard ID to update backend config")
        return False
    
    controller_file = "backend/src/main/java/com/branddashboard/controller/ReportController.java"
    
    try:
        with open(controller_file, 'r') as f:
            content = f.read()
        
        # Replace the hardcoded dashboard ID - look for the actual pattern
        old_pattern = r'private static final String SUPERSET_DASHBOARD_ID = "[^"]+";'
        new_value = f'private static final String SUPERSET_DASHBOARD_ID = "{dashboard_id}";'
        
        new_content = re.sub(old_pattern, new_value, content)
        
        # If no replacement was made, try a different pattern
        if new_content == content:
            old_pattern = r'SUPERSET_DASHBOARD_ID = "[^"]+";'
            new_content = re.sub(old_pattern, f'SUPERSET_DASHBOARD_ID = "{dashboard_id}";', content)
        
        if new_content != content:
            with open(controller_file, 'w') as f:
                f.write(new_content)
            
            print(f"✅ Updated backend configuration with dashboard ID: {dashboard_id}")
            return True
        else:
            print("⚠️ Could not find dashboard ID pattern to replace in backend")
            return False
        
    except Exception as e:
        print(f"❌ Failed to update backend configuration: {e}")
        return False

def main():
    print("🚀 Starting complete Superset setup for embedded dashboards...")
    
    # Wait for Superset
    if not wait_for_superset():
        sys.exit(1)
    
    # Login
    session = login_to_superset()
    if not session:
        sys.exit(1)
    
    # Create guest role
    create_guest_role(session)
    
    # Add database connection
    add_database_connection(session)
    
    # Create sample dashboard
    dashboard_id = create_sample_dashboard(session)
    
    # Update backend configuration
    if dashboard_id:
        if update_backend_config(dashboard_id):
            print("\n🎉 Setup complete!")
            print("Next steps:")
            print("1. Restart the backend container: docker-compose restart backend")
            print("2. Test the embedded dashboard in your frontend")
            print(f"3. Dashboard ID {dashboard_id} has been configured")
        else:
            print(f"\n⚠️ Setup partially complete. Dashboard ID is {dashboard_id}")
            print("You may need to manually update the backend configuration.")
    else:
        print("\n❌ Setup failed - could not create dashboard")

if __name__ == "__main__":
    main()
