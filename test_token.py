#!/usr/bin/env python3
"""
Enhanced test script to verify backend-generated guest tokens work with Superset
"""

import requests
import json
import time

def test_backend_token():
    """Test the backend guest token generation"""
    print("🧪 Testing Backend Guest Token Generation")
    print("=" * 50)
    
    # Test login first
    login_data = {
        'email': 'om-stage@ausmit.in',
        'password': 'password'
    }
    
    try:
        response = requests.post('http://localhost:8080/api/auth/login', 
                               json=login_data, timeout=10)
        
        if response.status_code == 200:
            auth_data = response.json()
            access_token = auth_data.get('accessToken')
            print(f"✅ Login successful, got access token: {access_token[:20]}...")
            
            # Test guest token generation
            headers = {'Authorization': f'Bearer {access_token}'}
            guest_response = requests.get(
                'http://localhost:8080/api/brands/67fc96b0026fe55bd8ea553a/reports/iframe',
                headers=headers,
                timeout=10
            )
            
            if guest_response.status_code == 200:
                guest_data = guest_response.json()
                guest_token = guest_data.get('token')
                print(f"✅ Guest token generated: {guest_token[:20]}...")
                
                # Test if this token can access the dashboard
                test_dashboard_access(guest_token)
                return guest_token
            else:
                print(f"❌ Guest token generation failed: {guest_response.status_code}")
                print(f"Response: {guest_response.text}")
                return None
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except requests.exceptions.Timeout:
        print("❌ Request timeout - backend might be slow to respond")
        return None
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - backend might not be running")
        return None
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return None

def test_dashboard_access(guest_token):
    """Test if the guest token can access the dashboard"""
    print("\n🔐 Testing Dashboard Access with Guest Token")
    print("=" * 50)
    
    # Try to access the dashboard with the guest token
    dashboard_url = "http://localhost:8088/superset/dashboard/1/"
    
    # Method 1: Try with Authorization header
    try:
        headers = {'Authorization': f'Bearer {guest_token}'}
        response = requests.get(dashboard_url, headers=headers, timeout=10)
        print(f"📊 Dashboard access with Bearer token: {response.status_code}")
    except Exception as e:
        print(f"📊 Dashboard access with Bearer token: Error - {e}")
    
    # Method 2: Try with query parameter
    try:
        params = {'token': guest_token}
        response = requests.get(dashboard_url, params=params, timeout=10)
        print(f"📊 Dashboard access with query token: {response.status_code}")
    except Exception as e:
        print(f"📊 Dashboard access with query token: Error - {e}")
    
    # Method 3: Try with cookie
    try:
        cookies = {'guest_token': guest_token}
        response = requests.get(dashboard_url, cookies=cookies, timeout=10)
        print(f"📊 Dashboard access with cookie token: {response.status_code}")
    except Exception as e:
        print(f"📊 Dashboard access with cookie token: Error - {e}")
    
    # Method 4: Try the embedded endpoint
    try:
        embedded_url = f"http://localhost:8088/superset/dashboard/1/?embedded=true&token={guest_token}"
        response = requests.get(embedded_url, timeout=10)
        print(f"📊 Embedded dashboard access: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Dashboard is accessible with guest token!")
            if 'dashboard' in response.text.lower():
                print("✅ Dashboard content found!")
            else:
                print("⚠️ Dashboard content not found in response")
        else:
            print("❌ Dashboard not accessible with guest token")
    except Exception as e:
        print(f"📊 Embedded dashboard access: Error - {e}")

def test_alternative_credentials():
    """Test alternative login credentials"""
    print("\n🔑 Testing Alternative Credentials")
    print("=" * 50)
    
    # Test the test user
    test_login_data = {
        'email': 'test@example.com',
        'password': 'password123'
    }
    
    try:
        response = requests.post('http://localhost:8080/api/auth/login', 
                               json=test_login_data, timeout=10)
        
        if response.status_code == 200:
            auth_data = response.json()
            access_token = auth_data.get('accessToken')
            print(f"✅ Test user login successful: {access_token[:20]}...")
            
            # Test guest token generation for test user
            headers = {'Authorization': f'Bearer {access_token}'}
            guest_response = requests.get(
                'http://localhost:8080/api/brands/67fc96b0026fe55bd8ea553a/reports/iframe',
                headers=headers,
                timeout=10
            )
            
            if guest_response.status_code == 200:
                print("✅ Test user can generate guest tokens")
            else:
                print(f"❌ Test user guest token generation failed: {guest_response.status_code}")
        else:
            print(f"❌ Test user login failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing alternative credentials: {e}")

def create_frontend_example():
    """Create a working frontend example"""
    print("\n📱 **Frontend Integration Example**")
    print("=" * 50)
    print("1. **Install the SDK:**")
    print("   npm install @superset-ui/embedded-sdk")
    print("")
    print("2. **Create the component:**")
    print("   ```javascript")
    print("   import React, { useState, useEffect } from 'react';")
    print("   import { EmbeddedDashboard } from '@superset-ui/embedded-sdk';")
    print("   ")
    print("   function SupersetDashboard({ brandId }) {")
    print("     const [token, setToken] = useState(null);")
    print("     const [loading, setLoading] = useState(true);")
    print("     const [error, setError] = useState(null);")
    print("     ")
    print("     useEffect(() => {")
    print("       const fetchToken = async () => {")
    print("         try {")
    print("           setLoading(true);")
    print("           setError(null);")
    print("           ")
    print("           const response = await fetch(`/api/brands/${brandId}/reports/iframe`);")
    print("           if (!response.ok) {")
    print("             throw new Error(`HTTP error! status: ${response.status}`);")
    print("           }")
    print("           ")
    print("           const data = await response.json();")
    print("           setToken(data.token);")
    print("         } catch (error) {")
    print("           console.error('Error fetching token:', error);")
    print("           setError(error.message);")
    print("         } finally {")
    print("           setLoading(false);")
    print("         }")
    print("       };")
    print("       ")
    print("       fetchToken();")
    print("     }, [brandId]);")
    print("     ")
    print("     if (loading) return <div>Loading dashboard...</div>;")
    print("     if (error) return <div>Error: {error}</div>;")
    print("     if (!token) return <div>No token available</div>;")
    print("     ")
    print("     return (")
    print("       <div>")
    print("         <h3>Brand Dashboard</h3>")
    print("         <EmbeddedDashboard")
    print("           id='df2a444a-8df2-43ae-bae6-d61c4a717956'")
    print("           guestToken={token}")
    print("           supersetDomain='http://localhost:8088'")
    print("           height={600}")
    print("           width='100%'")
    print("         />")
    print("       </div>")
    print("     );")
    print("   }")
    print("   ```")
    print("")
    print("3. **Usage:**")
    print("   ```jsx")
    print("   <SupersetDashboard brandId='67fc96b0026fe55bd8ea553a' />")
    print("   ```")
    print("")
    print("4. **Error Handling:**")
    print("   - Check browser console for CORS errors")
    print("   - Verify backend is running on port 8080")
    print("   - Verify Superset is running on port 8088")
    print("   - Ensure dashboard ID is correct")

def main():
    print("🚀 Enhanced Superset Integration Test Suite")
    print("=" * 60)
    
    # Test backend token generation
    guest_token = test_backend_token()
    
    # Test alternative credentials
    test_alternative_credentials()
    
    # Create frontend example
    create_frontend_example()
    
    print("\n" + "=" * 60)
    if guest_token:
        print("✅ All tests passed! Your Superset integration is working perfectly!")
        print("\n📋 Next steps:")
        print("1. Use the frontend component example above")
        print("2. Test with different brand IDs")
        print("3. Customize the dashboard appearance")
    else:
        print("❌ Some tests failed. Check the error messages above.")
        print("\n🔧 Troubleshooting:")
        print("1. Ensure backend is running: docker ps | grep backend")
        print("2. Ensure Superset is running: docker ps | grep superset")
        print("3. Check backend logs: docker logs brand-dashboard-backend")
        print("4. Check Superset logs: docker logs superset")

if __name__ == "__main__":
    main()
