// Test Backend Endpoints
// Run this in your browser console to test the backend proxy endpoints

console.log('🧪 Testing Backend Endpoints...');

// Test 1: Check Superset Health via Backend
const testSupersetHealth = async () => {
    console.log('🏥 Testing Superset health via backend...');
    try {
        const response = await fetch('/api/brands/test/reports/superset-health');
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Superset health check:', data);
        } else {
            console.log('❌ Superset health check failed:', response.status);
        }
    } catch (error) {
        console.log('❌ Superset health check error:', error);
    }
};

// Test 2: Check Dashboard List via Backend (replace 'test' with actual brand ID)
const testDashboardList = async (brandId = 'test') => {
    console.log(`📊 Testing dashboard list via backend for brand: ${brandId}...`);
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('❌ No auth token available');
            return;
        }
        
        const response = await fetch(`/api/brands/${brandId}/reports/dashboards`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Dashboard list via backend:', data);
            
            // If we got dashboards, show them
            if (data && Array.isArray(data)) {
                console.log(`Found ${data.length} dashboards:`);
                data.forEach((d, i) => {
                    console.log(`${i + 1}. ID: ${d.id}, UUID: ${d.uuid}, Title: ${d.dashboard_title}`);
                });
            }
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.log('❌ Dashboard list failed:', response.status, errorData);
        }
    } catch (error) {
        console.log('❌ Dashboard list error:', error);
    }
};

// Test 3: Check iframe token generation
const testIframeToken = async (brandId = 'test') => {
    console.log(`🎫 Testing iframe token generation for brand: ${brandId}...`);
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('❌ No auth token available');
            return;
        }
        
        const response = await fetch(`/api/brands/${brandId}/reports/iframe`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Iframe token generated:', data);
            console.log('Token preview:', data.token ? data.token.substring(0, 20) + '...' : 'No token');
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.log('❌ Iframe token failed:', response.status, errorData);
        }
    } catch (error) {
        console.log('❌ Iframe token error:', error);
    }
};

// Run tests
console.log('🚀 Starting backend endpoint tests...');

// Test health check first
setTimeout(testSupersetHealth, 1000);

// Test dashboard list (you'll need to replace 'test' with actual brand ID)
setTimeout(() => testDashboardList('test'), 2000);

// Test iframe token generation
setTimeout(() => testIframeToken('test'), 3000);

console.log('🔍 Tests initiated. Check console for results.');
console.log('💡 Replace "test" with your actual brand ID in the test functions.');
