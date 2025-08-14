// Test script for debugging Superset dashboard loading issues
// Run this in the browser console on the brand page

console.log('🧪 Starting Superset Dashboard Loading Test...');

// Test 1: Check SDK availability
console.log('=== SDK Availability Test ===');
console.log('embedDashboard function available:', typeof embedDashboard === 'function');
console.log('window.embedDashboard available:', typeof window.embedDashboard === 'function');
console.log('SDK import status:', embedDashboard);

// Test 2: Check container availability
console.log('=== Container Availability Test ===');
const containers = {
    'dashboard-sdk-numeric': document.getElementById('dashboard-sdk-numeric'),
    'dashboard-sdk-uuid': document.getElementById('dashboard-sdk-uuid'),
    'dashboard-iframe-numeric': document.getElementById('dashboard-iframe-numeric'),
    'dashboard-iframe-uuid': document.getElementById('dashboard-iframe-uuid')
};

Object.entries(containers).forEach(([id, container]) => {
    console.log(`${id}:`, container ? 'Found' : 'NOT FOUND');
    if (container) {
        console.log(`  - ID: ${container.id}`);
        console.log(`  - Children: ${container.children.length}`);
        console.log(`  - InnerHTML length: ${container.innerHTML.length}`);
    }
});

// Test 3: Check Superset connection
console.log('=== Superset Connection Test ===');
fetch('http://localhost:8088/superset/dashboard/1/')
    .then(response => {
        console.log('Superset dashboard 1 response status:', response.status);
        console.log('Superset dashboard 1 response ok:', response.ok);
    })
    .catch(error => {
        console.error('Superset dashboard 1 connection failed:', error);
    });

// Test 4: Check specific dashboard UUID (from backend config)
console.log('=== Dashboard UUID Test ===');
const DASHBOARD_UUID = 'df2a444a-8df2-43ae-bae6-d61c4a717956';
fetch(`http://localhost:8088/superset/dashboard/${DASHBOARD_UUID}/`)
    .then(response => {
        console.log(`Dashboard ${DASHBOARD_UUID} response status:`, response.status);
        console.log(`Dashboard ${DASHBOARD_UUID} response ok:`, response.ok);
        if (response.ok) {
            console.log('✅ Dashboard UUID exists and is accessible');
        } else {
            console.log(`❌ Dashboard UUID returned status: ${response.status}`);
        }
    })
    .catch(error => {
        console.error(`Dashboard ${DASHBOARD_UUID} connection failed:`, error);
    });

// Test 5: Check iframe loading
console.log('=== Iframe Loading Test ===');
const testIframe = document.createElement('iframe');
testIframe.src = 'http://localhost:8088/superset/dashboard/1/?embedded=true';
testIframe.style.width = '100px';
testIframe.style.height = '100px';
testIframe.style.border = '1px solid red';

// Add to page temporarily for testing
document.body.appendChild(testIframe);

setTimeout(() => {
    console.log('Test iframe loaded:', testIframe);
    console.log('Test iframe contentWindow:', testIframe.contentWindow);
    console.log('Test iframe contentDocument:', testIframe.contentDocument);
    
    // Remove test iframe
    document.body.removeChild(testIframe);
}, 3000);

// Test 6: Check token generation
console.log('=== Token Generation Test ===');
// This would need to be run after authentication
if (localStorage.getItem('token')) {
    console.log('Auth token available:', localStorage.getItem('token').substring(0, 20) + '...');
} else {
    console.log('No auth token available');
}

// Test 7: Check available dashboards
console.log('=== Available Dashboards Test ===');
fetch('http://localhost:8088/superset/dashboard/list/')
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error(`Dashboard list returned status: ${response.status}`);
        }
    })
    .then(data => {
        console.log('Available dashboards:', data);
        if (data && Array.isArray(data)) {
            console.log(`Found ${data.length} dashboards`);
            
            // Look for our specific dashboard
            const ourDashboard = data.find(d => 
                d.id === 1 || 
                d.uuid === DASHBOARD_UUID ||
                d.dashboard_title?.toLowerCase().includes('brand')
            );
            
            if (ourDashboard) {
                console.log('✅ Found our dashboard:', ourDashboard);
            } else {
                console.log('❌ Our dashboard not found in list');
            }
        }
    })
    .catch(error => {
        console.error('Error fetching dashboard list:', error);
    });

console.log('🧪 Test script completed. Check console for results.');
