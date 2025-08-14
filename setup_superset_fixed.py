#!/usr/bin/env python3
"""
Fixed Superset setup script with proper authentication handling
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
    max_retries = 30
    for i in range(max_retries):
        try:
            response = requests.get(f"{SUPERSET_URL}/login/", timeout=5)
            if response.status_code == 200:
                print("✅ Superset is ready!")
                time.sleep(2)
                return True
        except requests.exceptions.RequestException:
            pass
        
        if i < max_retries - 1:
            print(f"⏳ Attempt {i+1}/{max_retries} - waiting...")
            time.sleep(2)
    
    print("❌ Superset is not responding after maximum retries")
    return False

def login_to_superset():
    """Login to Superset and get authenticated session"""
    session = requests.Session()
    
    try:
        # Use API login
        login_data = {
            'username': ADMIN_USERNAME,
            'password': ADMIN_PASSWORD,
            'provider': 'db',
            'refresh': True
        }
        
        response = session.post(f"{SUPERSET_URL}/api/v1/security/login", json=login_data)
        
        if response.status_code == 200:
            result = response.json()
            access_token = result.get('access_token')
            refresh_token = result.get('refresh_token')
            
            if access_token:
                # Update session headers with the bearer token
                session.headers.update({
                    'Authorization': f'Bearer {access_token}',
                    'Content-Type': 'application/json',
                    'X-CSRFToken': '',  # Disable CSRF for API calls
                })
                
                # Store tokens for potential refresh
                session.access_token = access_token
                session.refresh_token = refresh_token
                
                print("✅ Successfully logged in to Superset")
                return session
        
        print(f"❌ Failed to login: {response.status_code}")
        print(f"Response: {response.text}")
        return None
            
    except Exception as e:
        print(f"❌ Error during login: {e}")
        return None

def get_csrf_token(session):
    """Get CSRF token for form-based requests"""
    try:
        response = session.get(f"{SUPERSET_URL}/api/v1/security/csrf_token")
        if response.status_code == 200:
            csrf_data = response.json()
            return csrf_data.get('result')
    except:
        pass
    return None

def create_database_connection(session):
    """Create MongoDB database connection via Trino"""
    try:
        print("🔗 Creating database connection...")
        
        # Check existing databases first
        response = session.get(f"{SUPERSET_URL}/api/v1/database")
        if response.status_code == 200:
            databases = response.json().get('result', [])
            for db in databases:
                if 'MongoDB' in db.get('database_name', ''):
                    print("✅ MongoDB database connection already exists")
                    return db.get('id')
        
        # Get CSRF token
        csrf_token = get_csrf_token(session)
        if csrf_token:
            session.headers['X-CSRFToken'] = csrf_token
        
        # Create new database connection
        db_data = {
            'database_name': 'MongoDB via Trino',
            'sqlalchemy_uri': 'trino://trino:8080/mongodb/default',
            'expose_in_sqllab': True,
            'allow_run_async': True,
            'allow_csv_upload': False,
            'allow_ctas': False,
            'allow_cvas': False,
            'allow_dml': False,
        }
        
        response = session.post(f"{SUPERSET_URL}/api/v1/database", json=db_data)
        
        if response.status_code in [200, 201]:
            db_id = response.json().get('id')
            print(f"✅ Successfully created database connection with ID: {db_id}")
            return db_id
        else:
            print(f"⚠️ Failed to create database: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        return None

def create_dashboard(session):
    """Create a sample dashboard"""
    try:
        print("📊 Creating dashboard...")
        
        # Check existing dashboards
        response = session.get(f"{SUPERSET_URL}/api/v1/dashboard")
        if response.status_code == 200:
            dashboards = response.json().get('result', [])
            for dashboard in dashboards:
                if dashboard.get('dashboard_title') == 'Brand Dashboard':
                    dashboard_id = dashboard.get('id')
                    print(f"✅ Brand Dashboard already exists with ID: {dashboard_id}")
                    return dashboard_id
        
        # Get fresh CSRF token
        csrf_token = get_csrf_token(session)
        if csrf_token:
            session.headers['X-CSRFToken'] = csrf_token
        
        # Create new dashboard
        dashboard_data = {
            'dashboard_title': 'Brand Dashboard',
            'slug': 'brand-dashboard',
            'published': True
        }
        
        response = session.post(f"{SUPERSET_URL}/api/v1/dashboard", json=dashboard_data)
        
        if response.status_code in [200, 201]:
            dashboard_id = response.json().get('id')
            print(f"✅ Successfully created dashboard with ID: {dashboard_id}")
            return dashboard_id
        else:
            print(f"⚠️ Failed to create dashboard: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error creating dashboard: {e}")
        return None

def get_dashboard_uuid(session, dashboard_id):
    """Get the UUID of a dashboard by its ID"""
    try:
        response = session.get(f"{SUPERSET_URL}/api/v1/dashboard/{dashboard_id}")
        if response.status_code == 200:
            dashboard_data = response.json().get('result', {})
            uuid = dashboard_data.get('uuid')
            if uuid:
                print(f"✅ Dashboard UUID: {uuid}")
                return uuid
        
        print(f"⚠️ Could not get dashboard UUID: {response.status_code}")
        return None
        
    except Exception as e:
        print(f"❌ Error getting dashboard UUID: {e}")
        return None

def update_backend_config(dashboard_uuid):
    """Update the backend configuration with the dashboard UUID"""
    if not dashboard_uuid:
        print("⚠️ No dashboard UUID to update")
        return False
    
    controller_file = "backend/src/main/java/com/branddashboard/controller/ReportController.java"
    
    try:
        with open(controller_file, 'r') as f:
            content = f.read()
        
        # Replace the dashboard UUID
        old_pattern = r'private static final String SUPERSET_DASHBOARD_ID = "[^"]*";'
        new_value = f'private static final String SUPERSET_DASHBOARD_ID = "{dashboard_uuid}";'
        
        new_content = re.sub(old_pattern, new_value, content)
        
        if new_content != content:
            with open(controller_file, 'w') as f:
                f.write(new_content)
            
            print(f"✅ Updated backend with dashboard UUID: {dashboard_uuid}")
            return True
        else:
            print("⚠️ Could not find pattern to replace in backend config")
            print(f"Looking for pattern: {old_pattern}")
            return False
        
    except Exception as e:
        print(f"❌ Failed to update backend: {e}")
        return False

def create_sample_dataset(session, database_id):
    """Create a sample dataset for testing"""
    if not database_id:
        return None
        
    try:
        print("📋 Creating sample dataset...")
        
        # Check if dataset exists
        response = session.get(f"{SUPERSET_URL}/api/v1/dataset")
        if response.status_code == 200:
            datasets = response.json().get('result', [])
            for dataset in datasets:
                if dataset.get('table_name') == 'brands':
                    print("✅ Sample dataset already exists")
                    return dataset.get('id')
        
        # Create dataset (this might fail if the table doesn't exist, that's ok)
        dataset_data = {
            'database': database_id,
            'table_name': 'brands',
            'schema': 'default'
        }
        
        csrf_token = get_csrf_token(session)
        if csrf_token:
            session.headers['X-CSRFToken'] = csrf_token
        
        response = session.post(f"{SUPERSET_URL}/api/v1/dataset", json=dataset_data)
        
        if response.status_code in [200, 201]:
            dataset_id = response.json().get('id')
            print(f"✅ Created sample dataset with ID: {dataset_id}")
            return dataset_id
        else:
            print(f"⚠️ Could not create dataset (table might not exist): {response.status_code}")
            return None
            
    except Exception as e:
        print(f"⚠️ Error creating dataset: {e}")
        return None

def main():
    print("🚀 Setting up Superset for embedded dashboards...")
    print("=" * 60)
    
    # Wait for Superset
    if not wait_for_superset():
        sys.exit(1)
    
    # Login
    session = login_to_superset()
    if not session:
        print("❌ Could not login to Superset")
        sys.exit(1)
    
    # Create database connection
    db_id = create_database_connection(session)
    
    # Create sample dataset
    if db_id:
        dataset_id = create_sample_dataset(session, db_id)
    
    # Create dashboard
    dashboard_id = create_dashboard(session)
    
    if dashboard_id:
        # Get dashboard UUID
        dashboard_uuid = get_dashboard_uuid(session, dashboard_id)
        
        if dashboard_uuid:
            # Update backend config
            if update_backend_config(dashboard_uuid):
                print("\n🎉 Setup completed successfully!")
                print(f"📊 Dashboard ID: {dashboard_id}")
                print(f"🆔 Dashboard UUID: {dashboard_uuid}")
                print(f"🔗 Database ID: {db_id}")
                print("\n📋 Next steps:")
                print("1. Restart backend container: docker-compose restart backend")
                print(f"2. Access Superset at: {SUPERSET_URL}")
                print("3. Test embedded dashboard in frontend")
            else:
                print(f"\n⚠️ Setup partially complete. Manual backend update needed.")
                print(f"Dashboard UUID: {dashboard_uuid}")
        else:
            print(f"\n⚠️ Could not get dashboard UUID for ID: {dashboard_id}")
    else:
        print("\n❌ Setup failed - could not create dashboard")

if __name__ == "__main__":
    main()
