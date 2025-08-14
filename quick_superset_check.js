// Quick Superset Dashboard Check
// Run this in your browser console to quickly diagnose dashboard issues

console.log('🔍 Quick Superset Dashboard Check...');

// Check 1: Superset Health
fetch('http://localhost:8088/superset/health')
    .then(r => console.log('✅ Superset Health:', r.status, r.ok))
    .catch(e => console.error('❌ Superset Health Failed:', e));

// Check 2: Dashboard List
fetch('http://localhost:8088/superset/dashboard/list/')
    .then(r => r.json())
    .then(dashboards => {
        console.log('📊 Available Dashboards:', dashboards);
        if (dashboards && Array.isArray(dashboards)) {
            console.log(`Found ${dashboards.length} dashboards`);
            dashboards.forEach((d, i) => {
                console.log(`${i + 1}. ID: ${d.id}, UUID: ${d.uuid}, Title: ${d.dashboard_title}`);
            });
            
            // Check if our expected dashboard exists
            const expectedUuid = 'df2a444a-8df2-43ae-bae6-d61c4a717956';
            const found = dashboards.find(d => d.uuid === expectedUuid);
            if (found) {
                console.log('✅ Expected dashboard found:', found);
            } else {
                console.log('❌ Expected dashboard NOT found');
                console.log('Available UUIDs:', dashboards.map(d => d.uuid));
            }
        }
    })
    .catch(e => console.error('❌ Dashboard List Failed:', e));

// Check 3: Test specific dashboard access
const testDashboard = (id) => {
    console.log(`🧪 Testing dashboard access for ID: ${id}`);
    fetch(`http://localhost:8088/superset/dashboard/${id}/`)
        .then(r => console.log(`Dashboard ${id}:`, r.status, r.ok))
        .catch(e => console.error(`Dashboard ${id} failed:`, e));
};

// Test both the expected UUID and numeric ID 1
setTimeout(() => testDashboard('df2a444a-8df2-43ae-bae6-d61c4a717956'), 1000);
setTimeout(() => testDashboard('1'), 2000);

console.log('🔍 Check complete. Look for results above.');
