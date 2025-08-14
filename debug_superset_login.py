#!/usr/bin/env python3
"""
Debug Superset login issues
"""

import requests
import re
import time

SUPERSET_URL = "http://localhost:8088"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin"

def debug_superset_status():
    """Check Superset status and endpoints"""
    print("🔍 Debugging Superset status...")
    
    endpoints_to_check = [
        "/",
        "/login/",
        "/health",
        "/api/v1/security/login"
    ]
    
    for endpoint in endpoints_to_check:
        try:
            url = f"{SUPERSET_URL}{endpoint}"
            print(f"\n📍 Checking {url}")
            response = requests.get(url, timeout=10)
            print(f"   Status: {response.status_code}")
            print(f"   Headers: {dict(response.headers)}")
            
            if endpoint == "/login/" and response.status_code == 200:
                # Check if it's the login page
                if "username" in response.text.lower() and "password" in response.text.lower():
                    print("   ✅ Login page detected")
                    # Look for CSRF token
                    csrf_matches = re.findall(r'csrf[_-]?token["\s]*[=:]["\s]*([^">\s]+)', response.text, re.IGNORECASE)
                    if csrf_matches:
                        print(f"   🔑 CSRF tokens found: {csrf_matches}")
                    else:
                        print("   ⚠️ No CSRF token found")
                else:
                    print("   ⚠️ Doesn't look like a login page")
                    
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Error: {e}")

def try_different_login_methods():
    """Try various login methods"""
    print("\n🔐 Trying different login methods...")
    
    session = requests.Session()
    
    # Method 1: API login
    print("\n1️⃣ Trying API login...")
    try:
        login_data = {
            'username': ADMIN_USERNAME,
            'password': ADMIN_PASSWORD,
            'provider': 'db',
            'refresh': True
        }
        
        response = session.post(f"{SUPERSET_URL}/api/v1/security/login", json=login_data, timeout=10)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
        
        if response.status_code == 200:
            result = response.json()
            if 'access_token' in result:
                print("   ✅ API login successful!")
                return session
                
    except Exception as e:
        print(f"   ❌ API login failed: {e}")
    
    # Method 2: Form login with CSRF
    print("\n2️⃣ Trying form login with CSRF...")
    try:
        # Get login page
        response = session.get(f"{SUPERSET_URL}/login/", timeout=10)
        print(f"   Login page status: {response.status_code}")
        
        if response.status_code == 200:
            # Extract CSRF token
            csrf_token = None
            csrf_patterns = [
                r'name="csrf_token" value="([^"]+)"',
                r'csrf_token["\s]*[=:]["\s]*["\']([^"\']+)["\']',
                r'<input[^>]*name=["\']csrf_token["\'][^>]*value=["\']([^"\']+)["\']'
            ]
            
            for pattern in csrf_patterns:
                match = re.search(pattern, response.text, re.IGNORECASE)
                if match:
                    csrf_token = match.group(1)
                    print(f"   🔑 CSRF token found: {csrf_token}")
                    break
            
            # Try login with CSRF
            login_data = {
                'username': ADMIN_USERNAME,
                'password': ADMIN_PASSWORD,
            }
            
            if csrf_token:
                login_data['csrf_token'] = csrf_token
            
            response = session.post(f"{SUPERSET_URL}/login/", data=login_data, timeout=10)
            print(f"   Login attempt status: {response.status_code}")
            print(f"   Final URL: {response.url}")
            
            # Check if redirected to dashboard or welcome
            if 'dashboard' in response.url or 'welcome' in response.url or response.status_code == 302:
                print("   ✅ Form login successful!")
                return session
                
    except Exception as e:
        print(f"   ❌ Form login failed: {e}")
    
    # Method 3: Simple form login without CSRF
    print("\n3️⃣ Trying simple form login...")
    try:
        session = requests.Session()
        login_data = {
            'username': ADMIN_USERNAME,
            'password': ADMIN_PASSWORD,
        }
        
        response = session.post(f"{SUPERSET_URL}/login/", data=login_data, timeout=10)
        print(f"   Status: {response.status_code}")
        print(f"   Final URL: {response.url}")
        
        if response.status_code in [200, 302] and ('dashboard' in response.url or 'welcome' in response.url):
            print("   ✅ Simple login successful!")
            return session
            
    except Exception as e:
        print(f"   ❌ Simple login failed: {e}")
    
    return None

def check_superset_logs():
    """Suggest checking Superset logs"""
    print("\n📋 If login continues to fail, check Superset container logs:")
    print("   docker-compose logs superset")
    print("\n💡 Common issues:")
    print("   - Admin user not created properly")
    print("   - Database not initialized")
    print("   - Superset still starting up")
    print("   - Wrong credentials")

def test_manual_login():
    """Test manual login steps"""
    print(f"\n🔧 Manual test steps:")
    print(f"1. Open browser and go to {SUPERSET_URL}")
    print(f"2. Try logging in with username: {ADMIN_USERNAME}, password: {ADMIN_PASSWORD}")
    print(f"3. If login fails, check if admin user was created properly")

def main():
    print("🐞 Superset Login Debug Tool")
    print("=" * 50)
    
    # Check basic connectivity
    debug_superset_status()
    
    # Try different login methods
    session = try_different_login_methods()
    
    if session:
        print("\n🎉 Login successful! Session is ready to use.")
        
        # Test a simple API call
        try:
            response = session.get(f"{SUPERSET_URL}/api/v1/dashboard", timeout=10)
            print(f"✅ API test successful: {response.status_code}")
        except Exception as e:
            print(f"⚠️ API test failed: {e}")
    else:
        print("\n❌ All login methods failed!")
        check_superset_logs()
        test_manual_login()

if __name__ == "__main__":
    main()
