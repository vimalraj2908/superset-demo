#!/usr/bin/env python3
"""
Get list of dashboards from Superset
"""

import requests
import json
import sys

SUPERSET_URL = "http://localhost:8088"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin"

def login_to_superset():
    """Login to Superset and get authenticated session"""
    session = requests.Session()
    
    try:
        print(f"🔐 Attempting to login to: {SUPERSET_URL}/api/v1/security/login")
        
        # Use API login
        login_data = {
            'username': ADMIN_USERNAME,
            'password': ADMIN_PASSWORD,
            'provider': 'db',
            'refresh': True
        }
        
        response = session.post(f"{SUPERSET_URL}/api/v1/security/login", json=login_data)
        
        print(f"📡 Login response status: {response.status_code}")
        print(f"📡 Login response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            access_token = result.get('access_token')
            
            if access_token:
                # Update session headers with the bearer token
                session.headers.update({
                    'Authorization': f'Bearer {access_token}',
                    'Content-Type': 'application/json',
                })
                
                print("✅ Successfully logged in to Superset")
                print(f"🔑 Access token: {access_token[:20]}...")
                print(f"📋 Full login response: {json.dumps(result, indent=2)}")
                return session
            else:
                print("❌ No access token in response")
                print(f"Response content: {response.text}")
        else:
            print(f"❌ Failed to login: {response.status_code}")
            print(f"Response content: {response.text}")
        
        return None
            
    except Exception as e:
        print(f"❌ Error during login: {e}")
        return None

def get_dashboards(session):
    """Get list of all dashboards"""
    try:
        print("📊 Retrieving dashboards...")
        print(f"🔗 Requesting: {SUPERSET_URL}/api/v1/dashboard")
        print(f"🔑 Headers: {dict(session.headers)}")
        
        print(f"🔗 Session base URL: {session.get(f'{SUPERSET_URL}/api/v1/dashboard').url}")
        response = session.get(f"{SUPERSET_URL}/api/v1/dashboard")
        
        print(f"📡 Dashboard response status: {response.status_code}")
        print(f"📡 Dashboard response URL: {response.url}")
        print(f"📡 Dashboard response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            dashboards = data.get('result', [])
            total_count = data.get('count', len(dashboards))
            
            print(f"\n📋 Found {total_count} dashboard(s):")
            print("=" * 80)
            
            if not dashboards:
                print("No dashboards found.")
                return []
            
            for i, dashboard in enumerate(dashboards, 1):
                dashboard_id = dashboard.get('id', 'N/A')
                dashboard_uuid = dashboard.get('uuid', 'N/A')
                title = dashboard.get('dashboard_title', 'Untitled')
                slug = dashboard.get('slug', 'N/A')
                published = dashboard.get('published', False)
                created_by = dashboard.get('created_by', {}).get('first_name', 'Unknown')
                created_on = dashboard.get('created_on_delta_humanized', dashboard.get('created_on', 'Unknown'))
                
                print(f"\n{i}. {title}")
                print(f"   ID: {dashboard_id}")
                print(f"   UUID: {dashboard_uuid}")
                print(f"   Slug: {slug}")
                print(f"   Published: {'Yes' if published else 'No'}")
                print(f"   Created by: {created_by}")
                print(f"   Created: {created_on}")
                print(f"   URL: {SUPERSET_URL}/superset/dashboard/{dashboard_id}/")
                
                # Get dashboard details
                try:
                    detail_response = session.get(f"{SUPERSET_URL}/api/v1/dashboard/{dashboard_id}")
                    if detail_response.status_code == 200:
                        detail_data = detail_response.json().get('result', {})
                        charts_count = len(detail_data.get('charts', []))
                        print(f"   Charts: {charts_count}")
                        
                        # Show chart titles if any
                        charts = detail_data.get('charts', [])
                        if charts:
                            chart_titles = [chart.get('slice_name', 'Untitled') for chart in charts[:3]]
                            if len(charts) > 3:
                                chart_titles.append(f"... and {len(charts) - 3} more")
                            print(f"   Chart titles: {', '.join(chart_titles)}")
                    
                except Exception as e:
                    print(f"   ⚠️ Could not get details: {e}")
                
                print("-" * 50)
            
            return dashboards
            
        else:
            print(f"❌ Failed to get dashboards: {response.status_code}")
            print(f"Response: {response.text}")
            return []
            
    except Exception as e:
        print(f"❌ Error getting dashboards: {e}")
        return []

def get_databases(session):
    """Get list of all databases for context"""
    try:
        print("\n🔗 Available databases:")
        
        response = session.get(f"{SUPERSET_URL}/api/v1/database")
        
        if response.status_code == 200:
            databases = response.json().get('result', [])
            
            for db in databases:
                db_id = db.get('id', 'N/A')
                db_name = db.get('database_name', 'Unnamed')
                sqlalchemy_uri = db.get('sqlalchemy_uri', 'N/A')
                print(f"   - {db_name} (ID: {db_id})")
                print(f"     URI: {sqlalchemy_uri}")
            
            return databases
        else:
            print(f"   ⚠️ Could not get databases: {response.status_code}")
            return []
            
    except Exception as e:
        print(f"   ❌ Error getting databases: {e}")
        return []

def get_charts(session):
    """Get list of all charts for context"""
    try:
        print("\n📈 Available charts:")
        
        response = session.get(f"{SUPERSET_URL}/api/v1/chart")
        
        if response.status_code == 200:
            charts = response.json().get('result', [])
            
            if not charts:
                print("   No charts found.")
                return []
            
            for chart in charts[:10]:  # Show first 10 charts
                chart_id = chart.get('id', 'N/A')
                chart_name = chart.get('slice_name', 'Untitled')
                viz_type = chart.get('viz_type', 'Unknown')
                print(f"   - {chart_name} (ID: {chart_id}, Type: {viz_type})")
            
            if len(charts) > 10:
                print(f"   ... and {len(charts) - 10} more charts")
                
            return charts
        else:
            print(f"   ⚠️ Could not get charts: {response.status_code}")
            return []
            
    except Exception as e:
        print(f"   ❌ Error getting charts: {e}")
        return []

def show_embed_info(dashboards):
    """Show embedding information for dashboards"""
    if not dashboards:
        return
        
    print("\n🔗 Embedding Information:")
    print("=" * 50)
    
    for dashboard in dashboards:
        dashboard_id = dashboard.get('id')
        dashboard_uuid = dashboard.get('uuid')
        title = dashboard.get('dashboard_title', 'Untitled')
        
        if dashboard_uuid:
            print(f"\n📊 {title}")
            print(f"   Dashboard ID: {dashboard_id}")
            print(f"   Dashboard UUID: {dashboard_uuid}")
            print(f"   Embed URL: {SUPERSET_URL}/superset/dashboard/{dashboard_id}/")
            print(f"   For backend config: SUPERSET_DASHBOARD_ID = \"{dashboard_uuid}\";")

def main():
    print("📋 Superset Dashboard Listing Tool")
    print("=" * 60)
    
    # Login
    session = login_to_superset()
    if not session:
        print("❌ Could not login to Superset")
        sys.exit(1)
    
    # Get dashboards
    dashboards = get_dashboards(session)
    
    # Get additional context
    get_databases(session)
    get_charts(session)
    
    # Show embedding info
    show_embed_info(dashboards)
    
    print("\n" + "=" * 60)
    print("✅ Dashboard listing complete!")

if __name__ == "__main__":
    main()
