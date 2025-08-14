// CORS Bypass Dashboard Check
// Run this in your browser console to check dashboards without CORS issues

console.log('🔍 CORS Bypass Dashboard Check...');

// Method 1: Try using JSONP approach (if Superset supports it)
const jsonpCheck = () => {
    console.log('📡 Trying JSONP approach...');
    const script = document.createElement('script');
    script.src = 'http://localhost:8088/superset/dashboard/list/?callback=handleDashboardList';
    document.head.appendChild(script);
    
    // Clean up
    setTimeout(() => {
        document.head.removeChild(script);
    }, 5000);
};

// Method 2: Check if we can access through iframe
const iframeCheck = () => {
    console.log('🖼️ Trying iframe approach...');
    const iframe = document.createElement('iframe');
    iframe.src = 'http://localhost:8088/superset/dashboard/list/';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = 'none';
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    
    document.body.appendChild(iframe);
    
    setTimeout(() => {
        try {
            console.log('Iframe loaded:', iframe);
            document.body.removeChild(iframe);
        } catch (e) {
            console.log('Iframe access blocked:', e);
        }
    }, 3000);
};

// Method 3: Check if we can access through image (for simple health check)
const imageCheck = () => {
    console.log('🖼️ Trying image approach for health check...');
    const img = new Image();
    img.onload = () => console.log('✅ Superset health check passed via image');
    img.onerror = () => console.log('❌ Superset health check failed via image');
    img.src = 'http://localhost:8088/superset/health';
};

// Method 4: Use your backend proxy endpoint
const backendCheck = async () => {
    console.log('🔗 Trying backend proxy endpoint...');
    try {
        // You'll need to replace this with your actual brand ID and auth token
        const brandId = 'your-brand-id'; // Replace with actual brand ID
        const token = localStorage.getItem('token'); // Get your auth token
        
        if (token) {
            const response = await fetch(`/api/brands/${brandId}/reports/dashboards`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Backend proxy response:', data);
            } else {
                console.log('❌ Backend proxy failed:', response.status);
            }
        } else {
            console.log('❌ No auth token available');
        }
    } catch (error) {
        console.log('❌ Backend proxy error:', error);
    }
};

// Method 5: Check if Superset is accessible at all
const basicCheck = () => {
    console.log('🌐 Basic connectivity check...');
    
    // Try to open Superset in new tab (this bypasses CORS)
    const newTab = window.open('http://localhost:8088/superset/dashboard/list/', '_blank');
    
    if (newTab) {
        console.log('✅ Superset opened in new tab - check that tab for dashboard list');
    } else {
        console.log('❌ Popup blocked - check if Superset is running at localhost:8088');
    }
};

// Run all checks
console.log('🚀 Running all CORS bypass checks...');

// Add global handler for JSONP (if it works)
window.handleDashboardList = (data) => {
    console.log('✅ JSONP response received:', data);
};

// Run checks with delays to avoid overwhelming
setTimeout(jsonpCheck, 1000);
setTimeout(iframeCheck, 2000);
setTimeout(imageCheck, 3000);
setTimeout(backendCheck, 4000);
setTimeout(basicCheck, 5000);

console.log('🔍 All checks initiated. Check console for results.');
console.log('💡 If CORS persists, the backend proxy approach is your best option.');
