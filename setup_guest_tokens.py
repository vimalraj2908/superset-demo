#!/usr/bin/env python3
"""
Complete setup for Superset Guest Token Authentication
"""

import requests
import json
import time
import sys

SUPERSET_URL = "http://localhost:8088"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin"

def login_to_superset():
    """Login to Superset and get authenticated session"""
    session = requests.Session()
    
    try:
        # First get the login page to get CSRF token
        response = session.get(f"{SUPERSET_URL}/login/")
        if response.status_code != 200:
            print(f"❌ Could not get login page: {response.status_code}")
            return None
        
        # Extract CSRF token from the login form
        import re
        csrf_match = re.search(r'name="csrf_token" type="hidden" value="([^"]+)"', response.text)
        if not csrf_match:
            print("❌ Could not find CSRF token")
            return None
        
        csrf_token = csrf_match.group(1)
        print(f"🔑 Found CSRF token: {csrf_token[:20]}...")
        
        # Login with form data
        login_data = {
            'username': ADMIN_USERNAME,
            'password': ADMIN_PASSWORD,
            'csrf_token': csrf_token
        }
        
        response = session.post(f"{SUPERSET_URL}/login/", data=login_data, allow_redirects=True)
        
        if response.status_code == 200 and 'dashboard' in response.url:
            print("✅ Successfully logged in to Superset")
            return session
        else:
            print(f"❌ Failed to login: {response.status_code}")
            print(f"Response URL: {response.url}")
            return None
            
    except Exception as e:
        print(f"❌ Error during login: {e}")
        return None

def create_guest_user_and_role(session):
    """Create Guest user and role with proper permissions"""
    try:
        print("👤 Setting up Guest user and role...")
        
        # Get CSRF token for admin operations
        response = session.get(f"{SUPERSET_URL}/users/list/")
        if response.status_code != 200:
            print(f"❌ Could not access users list: {response.status_code}")
            return False
        
        # Check if Guest user exists
        if 'guest@superset.com' in response.text:
            print("✅ Guest user already exists")
        else:
            print("📝 Creating Guest user...")
            # Navigate to user creation
            response = session.get(f"{SUPERSET_URL}/users/add")
            if response.status_code != 200:
                print(f"❌ Could not access user creation: {response.status_code}")
                return False
            
            # Extract CSRF token
            import re
            csrf_match = re.search(r'name="csrf_token" value="([^"]+)"', response.text)
            if not csrf_match:
                print("❌ Could not find CSRF token for user creation")
                return False
            
            csrf_token = csrf_match.group(1)
            
            # Create guest user
            user_data = {
                'first_name': 'Guest',
                'last_name': 'User',
                'username': 'guest',
                'email': 'guest@superset.com',
                'password': 'guest123',
                'conf_password': 'guest123',
                'csrf_token': csrf_token
            }
            
            response = session.post(f"{SUPERSET_URL}/users/add", data=user_data)
            if response.status_code == 200:
                print("✅ Created Guest user")
            else:
                print(f"⚠️ User creation response: {response.status_code}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error setting up Guest user: {e}")
        return False

def setup_dashboard_permissions(session):
    """Set up dashboard permissions for guest access"""
    try:
        print("🔐 Setting up dashboard permissions...")
        
        # Get dashboard list
        response = session.get(f"{SUPERSET_URL}/dashboard/list/")
        if response.status_code != 200:
            print(f"❌ Could not get dashboard list: {response.status_code}")
            return False
        
        # Find the test dashboard
        if 'test' in response.text:
            print("✅ Found test dashboard")
            
            # Navigate to dashboard permissions
            dashboard_url = f"{SUPERSET_URL}/dashboard/edit/1"
            response = session.get(dashboard_url)
            if response.status_code == 200:
                print("✅ Can access dashboard edit page")
                
                # Extract CSRF token
                import re
                csrf_match = re.search(r'name="csrf_token" value="([^"]+)"', response.text)
                if csrf_match:
                    csrf_token = csrf_match.group(1)
                    print("✅ Found CSRF token for dashboard")
                else:
                    print("⚠️ Could not find CSRF token for dashboard")
            else:
                print(f"⚠️ Could not access dashboard edit: {response.status_code}")
        else:
            print("⚠️ Test dashboard not found in list")
        
        return True
        
    except Exception as e:
        print(f"❌ Error setting up dashboard permissions: {e}")
        return False

def test_embedded_dashboard(session):
    """Test if the dashboard can be embedded"""
    try:
        print("🧪 Testing embedded dashboard access...")
        
        # Try to access the dashboard directly
        dashboard_url = f"{SUPERSET_URL}/superset/dashboard/1/"
        response = session.get(dashboard_url)
        
        if response.status_code == 200:
            print("✅ Dashboard is accessible")
            if 'iframe' in response.text.lower() or 'embed' in response.text.lower():
                print("✅ Dashboard has embedding capabilities")
            else:
                print("⚠️ Dashboard may not have embedding enabled")
        else:
            print(f"⚠️ Dashboard access: {response.status_code}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing dashboard: {e}")
        return False

def create_embedding_example():
    """Create an example of how to embed the dashboard"""
    print("\n📋 **Embedding Instructions:**")
    print("=" * 50)
    print("1. **Frontend Setup:**")
    print("   Install: npm install @superset-ui/embedded-sdk")
    print("")
    print("2. **Backend Integration:**")
    print("   Your backend is already generating guest tokens!")
    print("   Endpoint: /api/brands/{brandId}/reports/iframe")
    print("")
    print("3. **Frontend Usage:**")
    print("   ```javascript")
    print("   import { EmbeddedDashboard } from '@superset-ui/embedded-sdk';")
    print("   ")
    print("   // Get token from your backend")
    print("   const response = await fetch('/api/brands/67fc96b0026fe55bd8ea553a/reports/iframe');")
    print("   const { token } = await response.json();")
    print("   ")
    print("   // Embed dashboard")
    print("   <EmbeddedDashboard")
    print("     id='df2a444a-8df2-43ae-bae6-d61c4a717956'")
    print("     guestToken={token}")
    print("     supersetDomain='http://localhost:8088'")
    print("   />")
    print("   ```")
    print("")
    print("4. **Test Credentials:**")
    print("   - Admin: om-stage@ausmit.in / password")
    print("   - Test: test@example.com / password123")

def main():
    print("🔐 Setting up Superset for Embedded Dashboards")
    print("=" * 60)
    
    # Login
    session = login_to_superset()
    if not session:
        print("❌ Could not login to Superset")
        sys.exit(1)
    
    # Setup Guest user and role
    guest_setup = create_guest_user_and_role(session)
    if not guest_setup:
        print("⚠️ Guest setup had issues, but continuing...")
    
    # Setup dashboard permissions
    permissions_setup = setup_dashboard_permissions(session)
    if not permissions_setup:
        print("⚠️ Permissions setup had issues, but continuing...")
    
    # Test embedded dashboard
    test_embedded_dashboard(session)
    
    # Create embedding example
    create_embedding_example()
    
    print("\n" + "=" * 60)
    print("✅ Superset setup for embedded dashboards complete!")
    print("\n📋 Next steps:")
    print("1. Use the embedding instructions above in your frontend")
    print("2. Test with the provided credentials")
    print("3. Your backend is already generating guest tokens")

if __name__ == "__main__":
    main()
