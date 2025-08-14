import { useRouter } from 'next/router';
import { useEffect, useState, createRef, useRef } from 'react';
import api from '../../lib/axios';
import { embedDashboard } from "@superset-ui/embedded-sdk";

export default function BrandPage() {
    const router = useRouter();
    const { brandId } = router.query;
    const [brand, setBrand] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [dashboardLoading, setDashboardLoading] = useState(true);
    const [dashboardError, setDashboardError] = useState('');
    const [debugInfo, setDebugInfo] = useState('');
    const dashboardContainer = useRef(null);

    // Auto-detect dashboard ID from Superset
    const [detectedDashboardId, setDetectedDashboardId] = useState(null);
    const [detectedDashboardUuid, setDetectedDashboardUuid] = useState(null);

    // Function to detect available dashboards and set correct IDs
    const detectDashboardIds = async () => {
        try {
            setDebugInfo('🔍 Detecting available dashboards in Superset...');
            
            // Try direct Superset access first
            let response;
            try {
                response = await fetch('http://localhost:8088/superset/dashboard/list/');
            } catch (corsError) {
                setDebugInfo('CORS blocked direct access, trying backend proxy...');
                // If CORS blocks direct access, try through backend proxy
                response = await api.get(`/brands/${brandId}/reports/dashboards`);
                if (response.data) {
                    const dashboards = response.data;
                    console.log('Available dashboards (via backend):', dashboards);
                    
                    if (dashboards && Array.isArray(dashboards) && dashboards.length > 0) {
                        const firstDashboard = dashboards[0];
                        const dashboardId = firstDashboard.id;
                        const dashboardUuid = firstDashboard.uuid;
                        
                        setDetectedDashboardId(dashboardId);
                        setDetectedDashboardUuid(dashboardUuid);
                        
                        setDebugInfo(`✅ Detected dashboard via backend: ID=${dashboardId}, UUID=${dashboardUuid}, Title=${firstDashboard.dashboard_title}`);
                        
                        // Update the constants
                        DASHBOARD_ID = dashboardId.toString();
                        DASHBOARD_UUID = dashboardUuid;
                        
                        return { id: dashboardId, uuid: dashboardUuid };
                    }
                }
                throw new Error('Backend proxy also failed');
            }
            
            if (response.ok) {
                const dashboards = await response.json();
                console.log('Available dashboards (direct):', dashboards);
                
                if (dashboards && Array.isArray(dashboards) && dashboards.length > 0) {
                    // Find the first available dashboard
                    const firstDashboard = dashboards[0];
                    const dashboardId = firstDashboard.id;
                    const dashboardUuid = firstDashboard.uuid;
                    
                    setDetectedDashboardId(dashboardId);
                    setDetectedDashboardUuid(dashboardUuid);
                    
                    setDebugInfo(`✅ Detected dashboard: ID=${dashboardId}, UUID=${dashboardUuid}, Title=${firstDashboard.dashboard_title}`);
                    
                    // Update the constants
                    DASHBOARD_ID = dashboardId.toString();
                    DASHBOARD_UUID = dashboardUuid;
                    
                    return { id: dashboardId, uuid: dashboardUuid };
                } else {
                    setDebugInfo('❌ No dashboards found in Superset');
                    return null;
                }
            } else {
                setDebugInfo(`❌ Could not fetch dashboard list (Status: ${response.status})`);
                return null;
            }
        } catch (error) {
            setDebugInfo(`❌ Error detecting dashboards: ${error.message}`);
            return null;
        }
    };

    // Correct dashboard ID from your backend - use the UUID that the backend generates tokens for
    let DASHBOARD_ID = "df2a444a-8df2-43ae-bae6-d61c4a717956"; // Use the UUID that backend generates tokens for
    let DASHBOARD_UUID = "df2a444a-8df2-43ae-bae6-d61c4a717956"; // Same UUID for consistency

    // Dashboard embedding function with multiple fallback options
    const embedSupersetDashboard = async () => {
        try {
            setDashboardLoading(true);
            setDashboardError('');
            setDebugInfo('Starting dashboard embedding process...');

            console.log('Fetching guest token for dashboard...');
            setDebugInfo('Fetching guest token...');
            
            const tokenRes = await api.get(`/brands/${brandId}/reports/iframe`);
            console.log('Token response:', tokenRes.data);
            setDebugInfo('Guest token received successfully');
            
            const embedToken = tokenRes.data.token;
            console.log('Embed token received:', embedToken.substring(0, 20) + '...');

            // Get or create container
            let container = dashboardContainer.current;
            if (!container) {
                console.log('Container ref is null, creating fallback container...');
                setDebugInfo('Creating fallback container...');
                
                // Create a fallback container
                container = document.createElement('div');
                container.id = 'dashboard-fallback-container';
                container.style.width = '100%';
                container.style.height = '100%';
                
                // Find the dashboard area and append the container
                const dashboardArea = document.querySelector('[data-dashboard-area]');
                if (dashboardArea) {
                    dashboardArea.appendChild(container);
                    console.log('Fallback container created and appended');
                } else {
                    throw new Error('Could not find dashboard area to append container');
                }
            }

            // Clear previous dashboard content
            container.innerHTML = '';

            // Try multiple approaches in sequence
            await tryMultipleDashboardApproaches(container, embedToken);

        } catch (err) {
            console.error('Dashboard embedding error:', err);
            const errorMsg = `Dashboard embedding failed: ${err.message}`;
            setDashboardError(errorMsg);
            setDebugInfo(`Error: ${err.message}`);
            setDashboardLoading(false);
        }
    };

    // Try multiple dashboard loading approaches
    const tryMultipleDashboardApproaches = async (container, embedToken) => {
        const approaches = [
            {
                name: 'SDK with UUID',
                method: () => trySDKApproach(container, embedToken, DASHBOARD_ID)
            },
            {
                name: 'SDK with UUID (Alt)',
                method: () => trySDKApproach(container, embedToken, DASHBOARD_UUID)
            },
            {
                name: 'Iframe with UUID',
                method: () => tryIframeApproach(container, embedToken, DASHBOARD_ID)
            },
            {
                name: 'Iframe with UUID (Alt)',
                method: () => tryIframeApproach(container, embedToken, DASHBOARD_UUID)
            }
        ];

        for (let i = 0; i < approaches.length; i++) {
            const approach = approaches[i];
            try {
                setDebugInfo(`Trying approach ${i + 1}: ${approach.name}...`);
                console.log(`Attempting: ${approach.name}`);
                
                const success = await approach.method();
                if (success) {
                    setDebugInfo(`✅ Success with: ${approach.name}`);
                    setDashboardLoading(false);
                    setDashboardError('');
                    return true;
                }
            } catch (err) {
                console.log(`❌ ${approach.name} failed:`, err.message);
                setDebugInfo(`❌ ${approach.name} failed: ${err.message}`);
                // Continue to next approach
            }
        }

        // If all approaches fail
        throw new Error('All dashboard loading approaches failed');
    };

    // Try SDK approach with given dashboard ID
    const trySDKApproach = async (container, embedToken, dashboardId) => {
        setDebugInfo(`Attempting SDK approach with ID: ${dashboardId}`);
        
        // Check if SDK is available - try both imported and window versions
        let sdkFunction = embedDashboard;
        if (typeof sdkFunction !== 'function') {
            sdkFunction = window.embedDashboard;
        }
        
        if (typeof sdkFunction !== 'function') {
            throw new Error('embedDashboard function not available - SDK may not be properly imported or loaded');
        }

        // Ensure container is properly set up
        if (!container || !container.id) {
            throw new Error('Container not properly initialized for SDK approach');
        }

        try {
            // First, verify the dashboard exists and is accessible
            setDebugInfo(`Verifying dashboard ${dashboardId} exists...`);
            const dashboardCheck = await fetch(`http://localhost:8088/superset/dashboard/${dashboardId}/`, {
                method: 'HEAD',
                headers: {
                    'Authorization': `Bearer ${embedToken}`
                }
            });
            
            if (!dashboardCheck.ok) {
                throw new Error(`Dashboard ${dashboardId} not accessible (Status: ${dashboardCheck.status})`);
            }
            
            setDebugInfo(`Dashboard ${dashboardId} verified, attempting SDK embedding...`);

            const result = await sdkFunction({
                id: dashboardId,
                supersetDomain: "http://localhost:8088",
                mountPoint: container,
                fetchGuestToken: () => Promise.resolve(embedToken),
                dashboardUiConfig: {
                    hideTitle: true,
                    hideChartControls: false,
                    hideTab: false,
                    hideEditControls: true,
                },
            });

            console.log('SDK approach result:', result);
            
            // Wait a bit for the dashboard to render
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Check if content was actually loaded
            if (container.children.length > 0 && container.innerHTML.trim() !== '') {
                setDebugInfo(`✅ SDK approach successful with ID: ${dashboardId}`);
                return true;
            } else {
                throw new Error('SDK returned success but no content loaded - container is empty');
            }
        } catch (sdkError) {
            console.error('SDK specific error:', sdkError);
            
            // Check if it's a 404 error specifically
            if (sdkError.message.includes('404') || sdkError.message.includes('not accessible')) {
                throw new Error(`Dashboard ${dashboardId} not found or not accessible - check if it exists in Superset`);
            }
            
            throw new Error(`SDK failed: ${sdkError.message}`);
        }
    };

    // Try iframe approach with given dashboard ID
    const tryIframeApproach = async (container, embedToken, dashboardId) => {
        setDebugInfo(`Attempting iframe approach with ID: ${dashboardId}`);
        
        // Clear container
        container.innerHTML = '';
        
        // Create iframe
        const iframe = document.createElement('iframe');
        
        // Try different URL formats based on dashboard ID type
        const isUUID = dashboardId.includes('-'); // Simple UUID detection
        let urls = [];
        
        if (isUUID) {
            // For UUID, try these formats
            urls = [
                `http://localhost:8088/superset/dashboard/${dashboardId}/?embedded=true&token=${embedToken}`,
                `http://localhost:8088/superset/dashboard/${dashboardId}/?embedded=true`,
                `http://localhost:8088/superset/dashboard/${dashboardId}/`,
                // Try with UUID in different format
                `http://localhost:8088/superset/dashboard/${dashboardId}?embedded=true&token=${embedToken}`,
            ];
        } else {
            // For numeric ID, try these formats
            urls = [
                `http://localhost:8088/superset/dashboard/${dashboardId}/?embedded=true&token=${embedToken}`,
                `http://localhost:8088/superset/dashboard/${dashboardId}/?embedded=true`,
                `http://localhost:8088/superset/dashboard/${dashboardId}/`,
                // Try without trailing slash
                `http://localhost:8088/superset/dashboard/${dashboardId}?embedded=true&token=${embedToken}`,
            ];
        }

        for (const url of urls) {
            try {
                console.log(`Trying iframe URL: ${url}`);
                setDebugInfo(`Trying iframe URL: ${url}`);
                
                iframe.src = url;
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.style.border = 'none';
                iframe.title = 'Superset Dashboard';
                
                // Clear container and add iframe
                container.innerHTML = '';
                container.appendChild(iframe);
                
                // Wait longer for iframe to load
                await new Promise(resolve => setTimeout(resolve, 4000));
                
                // Check if iframe loaded successfully
                try {
                    if (iframe.contentDocument && iframe.contentDocument.body && iframe.contentDocument.body.innerHTML.trim() !== '') {
                        setDebugInfo(`✅ Iframe approach successful with ID: ${dashboardId} using URL: ${url}`);
                        return true;
                    }
                } catch (crossOriginError) {
                    // Cross-origin restrictions - check if iframe is visible and has loaded
                    if (iframe.offsetHeight > 0 && iframe.offsetWidth > 0) {
                        setDebugInfo(`✅ Iframe approach successful with ID: ${dashboardId} (cross-origin detected)`);
                        return true;
                    }
                }
            } catch (err) {
                console.log(`Iframe URL ${url} failed:`, err.message);
                setDebugInfo(`Iframe URL ${url} failed: ${err.message}`);
                // Continue to next URL
            }
        }
        
        throw new Error(`All iframe URLs failed for dashboard ID: ${dashboardId}`);
    };

    // Check what dashboards are available in Superset
    const checkAvailableDashboards = async () => {
        setDebugInfo('🔍 Checking available dashboards in Superset...');
        
        try {
            // Try to get dashboard list from Superset
            const response = await fetch('http://localhost:8088/superset/dashboard/list/', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Available dashboards:', data);
                setDebugInfo(`Found ${data.length || 0} dashboards in Superset`);
                
                // Look for our specific dashboard
                if (data && Array.isArray(data)) {
                    const ourDashboard = data.find(d => 
                        d.id === 1 || 
                        d.uuid === DASHBOARD_UUID ||
                        d.dashboard_title?.toLowerCase().includes('brand')
                    );
                    
                    if (ourDashboard) {
                        setDebugInfo(`✅ Found our dashboard: ID=${ourDashboard.id}, UUID=${ourDashboard.uuid}, Title=${ourDashboard.dashboard_title}`);
                    } else {
                        setDebugInfo(`❌ Our dashboard not found in Superset list`);
                    }
                }
            } else {
                setDebugInfo(`❌ Could not fetch dashboard list (Status: ${response.status})`);
            }
        } catch (error) {
            setDebugInfo(`❌ Error checking dashboards: ${error.message}`);
        }
    };

    // Helper function to update dashboard status
    const updateDashboardStatus = (containerId, status, message = '') => {
        const statusElement = document.getElementById(`status-${containerId}`);
        if (statusElement) {
            let statusText = '';
            let color = '';
            
            switch (status) {
                case 'loading':
                    statusText = '🔄 Loading...';
                    color = '#ffc107';
                    break;
                case 'success':
                    statusText = '✅ Loaded';
                    color = '#28a745';
                    break;
                case 'error':
                    statusText = `❌ Failed${message ? `: ${message}` : ''}`;
                    color = '#dc3545';
                    break;
                case 'waiting':
                    statusText = '⏳ Waiting...';
                    color = '#6c757d';
                    break;
                default:
                    statusText = status;
                    color = '#6c757d';
            }
            
            statusElement.textContent = statusText;
            statusElement.style.color = color;
        }
    };

    // Load specific dashboard in specific container
    const loadSpecificDashboard = async (containerId, dashboardId, approach) => {
        try {
            setDebugInfo(`Loading ${approach} dashboard with ID: ${dashboardId} in container: ${containerId}`);
            
            // Update status to loading
            updateDashboardStatus(containerId, 'loading');
            
            // Get the specific container
            const container = document.getElementById(containerId);
            if (!container) {
                throw new Error(`Container ${containerId} not found`);
            }

            // Clear container
            container.innerHTML = '';

            // Show loading state
            container.innerHTML = `
                <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; color: #666;">
                    <div style="margin-bottom: 10px;">🔄</div>
                    <p>Loading ${approach} Dashboard...</p>
                </div>
            `;

            // Fetch guest token
            const tokenRes = await api.get(`/brands/${brandId}/reports/iframe`);
            const embedToken = tokenRes.data.token;

            if (approach === 'SDK') {
                // Try SDK approach
                try {
                    let sdkFunction = embedDashboard;
                    if (typeof sdkFunction !== 'function') {
                        sdkFunction = window.embedDashboard;
                    }
                    
                    if (typeof sdkFunction !== 'function') {
                        throw new Error('SDK not available anywhere');
                    }

                    const result = await sdkFunction({
                        id: dashboardId,
                        supersetDomain: "http://localhost:8088",
                        mountPoint: container,
                        fetchGuestToken: () => Promise.resolve(embedToken),
                        dashboardUiConfig: {
                            hideTitle: true,
                            hideChartControls: false,
                            hideTab: false,
                            hideEditControls: true,
                        },
                    });

                    console.log(`${containerId} SDK result:`, result);
                    setDebugInfo(`✅ ${containerId} loaded successfully with SDK`);
                    updateDashboardStatus(containerId, 'success');
                } catch (err) {
                    console.log(`${containerId} SDK failed:`, err.message);
                    updateDashboardStatus(containerId, 'error', err.message);
                    // Fallback to iframe
                    throw new Error('SDK failed, will try iframe');
                }
            } else {
                // Iframe approach
                const iframe = document.createElement('iframe');
                iframe.src = `http://localhost:8088/superset/dashboard/${dashboardId}/?embedded=true&token=${embedToken}`;
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.style.border = 'none';
                iframe.title = 'Superset Dashboard';
                
                container.innerHTML = '';
                container.appendChild(iframe);
                
                setDebugInfo(`✅ ${containerId} loaded successfully with iframe`);
                updateDashboardStatus(containerId, 'success');
            }

        } catch (err) {
            console.error(`Error loading ${containerId}:`, err);
            setDebugInfo(`❌ ${containerId} failed: ${err.message}`);
            updateDashboardStatus(containerId, 'error', err.message);
            
            // Show error state in container
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; color: #dc3545; text-align: center; padding: 20px;">
                        <div style="margin-bottom: 10px;">❌</div>
                        <p>Failed to load</p>
                        <p style="font-size: 12px; margin-top: 5px;">${err.message}</p>
                    </div>
                `;
            }
        }
    };

    // Comprehensive test function for debugging
    const runComprehensiveTest = async () => {
        setDebugInfo('🧪 Starting comprehensive dashboard test...');
        
        const testResults = {
            'SDK + Numeric ID': { status: 'pending', error: null },
            'SDK + UUID': { status: 'pending', error: null },
            'Iframe + Numeric ID': { status: 'pending', error: null },
            'Iframe + UUID': { status: 'pending', error: null }
        };
        
        try {
            // Test 1: SDK with Numeric ID
            setDebugInfo('🧪 Testing SDK + Numeric ID...');
            try {
                const container = document.getElementById('dashboard-sdk-numeric');
                if (container) {
                    const tokenRes = await api.get(`/brands/${brandId}/reports/iframe`);
                    const embedToken = tokenRes.data.token;
                    
                    await trySDKApproach(container, embedToken, DASHBOARD_ID);
                    testResults['SDK + Numeric ID'] = { status: 'success', error: null };
                    setDebugInfo('✅ SDK + Numeric ID test passed');
                }
            } catch (err) {
                testResults['SDK + Numeric ID'] = { status: 'failed', error: err.message };
                setDebugInfo(`❌ SDK + Numeric ID test failed: ${err.message}`);
            }
            
            // Test 2: SDK with UUID
            setDebugInfo('🧪 Testing SDK + UUID...');
            try {
                const container = document.getElementById('dashboard-sdk-uuid');
                if (container) {
                    const tokenRes = await api.get(`/brands/${brandId}/reports/iframe`);
                    const embedToken = tokenRes.data.token;
                    
                    await trySDKApproach(container, embedToken, DASHBOARD_UUID);
                    testResults['SDK + UUID'] = { status: 'success', error: null };
                    setDebugInfo('✅ SDK + UUID test passed');
                }
            } catch (err) {
                testResults['SDK + UUID'] = { status: 'failed', error: err.message };
                setDebugInfo(`❌ SDK + UUID test failed: ${err.message}`);
            }
            
            // Test 3: Iframe with Numeric ID
            setDebugInfo('🧪 Testing Iframe + Numeric ID...');
            try {
                const container = document.getElementById('dashboard-iframe-numeric');
                if (container) {
                    const tokenRes = await api.get(`/brands/${brandId}/reports/iframe`);
                    const embedToken = tokenRes.data.token;
                    
                    await tryIframeApproach(container, embedToken, DASHBOARD_ID);
                    testResults['Iframe + Numeric ID'] = { status: 'success', error: null };
                    setDebugInfo('✅ Iframe + Numeric ID test passed');
                }
            } catch (err) {
                testResults['Iframe + Numeric ID'] = { status: 'failed', error: err.message };
                setDebugInfo(`❌ Iframe + Numeric ID test failed: ${err.message}`);
            }
            
            // Test 4: Iframe with UUID
            setDebugInfo('🧪 Testing Iframe + UUID...');
            try {
                const container = document.getElementById('dashboard-iframe-uuid');
                if (container) {
                    const tokenRes = await api.get(`/brands/${brandId}/reports/iframe`);
                    const embedToken = tokenRes.data.token;
                    
                    await tryIframeApproach(container, embedToken, DASHBOARD_UUID);
                    testResults['Iframe + UUID'] = { status: 'success', error: null };
                    setDebugInfo('✅ Iframe + UUID test passed');
                }
            } catch (err) {
                testResults['Iframe + UUID'] = { status: 'failed', error: err.message };
                setDebugInfo(`❌ Iframe + UUID test failed: ${err.message}`);
            }
            
            // Summary
            const summary = Object.entries(testResults)
                .map(([test, result]) => `${test}: ${result.status === 'success' ? '✅' : '❌'}`)
                .join(' | ');
            
            setDebugInfo(`🧪 Comprehensive test complete! ${summary}`);
            console.log('Comprehensive test results:', testResults);
            
        } catch (err) {
            setDebugInfo(`❌ Comprehensive test failed: ${err.message}`);
        }
    };

    // Load all dashboards simultaneously
    const loadAllDashboards = async () => {
        try {
            setDebugInfo('🚀 Loading all dashboards simultaneously...');
            
            // Load all dashboards in parallel
            const promises = [
                loadSpecificDashboard('dashboard-sdk-numeric', DASHBOARD_ID, 'SDK'),
                loadSpecificDashboard('dashboard-sdk-uuid', DASHBOARD_UUID, 'SDK'),
                loadSpecificDashboard('dashboard-iframe-numeric', DASHBOARD_ID, 'iframe'),
                loadSpecificDashboard('dashboard-iframe-uuid', DASHBOARD_UUID, 'iframe')
            ];

            // Wait for all to complete (or fail)
            const results = await Promise.allSettled(promises);
            
            // Count successes and failures
            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;
            
            setDebugInfo(`✅ Dashboard loading complete! ${successful} successful, ${failed} failed`);
            
            console.log('All dashboard results:', results);
            
        } catch (err) {
            console.error('Error loading all dashboards:', err);
            setDebugInfo(`❌ Error loading all dashboards: ${err.message}`);
        }
    };

    // Check SDK availability immediately
    useEffect(() => {
        console.log('SDK Check - embedDashboard available:', typeof embedDashboard === 'function');
        console.log('SDK Check - embedDashboard function:', embedDashboard);
        console.log('SDK Check - window.embedDashboard:', typeof window.embedDashboard === 'function');
        
        const sdkStatus = typeof embedDashboard === 'function' ? 'Available' : 'NOT AVAILABLE';
        setDebugInfo(`SDK Status: ${sdkStatus}`);
        
        // Additional SDK checks
        if (typeof embedDashboard !== 'function') {
            console.error('SDK not available - checking alternatives...');
            setDebugInfo('SDK not available - checking alternatives...');
            
            // Check if SDK is available on window object
            if (typeof window.embedDashboard === 'function') {
                console.log('SDK found on window object');
                setDebugInfo('SDK found on window object - will use that');
            } else {
                console.error('SDK not found anywhere - iframe approach will be used');
                setDebugInfo('SDK not found anywhere - iframe approach will be used');
            }
        }
        
        // Auto-detect dashboard IDs first
        const initializeDashboards = async () => {
            const detected = await detectDashboardIds();
            if (detected) {
                setDebugInfo(`Dashboard IDs updated: ID=${detected.id}, UUID=${detected.uuid}`);
                // Now load dashboards with correct IDs
                setTimeout(() => {
                    if (brandId) {
                        console.log('BrandId ready, starting all dashboard loading...');
                        setDebugInfo('BrandId ready, starting all dashboard loading...');
                        loadAllDashboards();
                    }
                }, 1000);
            } else {
                setDebugInfo('Could not detect dashboard IDs, using fallback approach');
                // Force check container after a longer delay to ensure the DOM is ready
                const checkContainer = () => {
                    console.log('Container check - brandId:', brandId);
                    if (brandId) {
                        console.log('BrandId ready, starting all dashboard loading...');
                        setDebugInfo('BrandId ready, starting all dashboard loading...');
                        // Load all dashboards when brandId is available
                        loadAllDashboards();
                    } else {
                        console.log('BrandId not ready yet, waiting...');
                        setDebugInfo('BrandId not ready yet, waiting...');
                        setTimeout(checkContainer, 500);
                    }
                };
                
                // Start checking after initial delay
                setTimeout(checkContainer, 1000);
            }
        };
        
        // Start dashboard detection
        initializeDashboards();
    }, [brandId]); // Add brandId as dependency

    useEffect(() => {
        // Check if user is authenticated
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
            return;
        }

        if (!brandId || isFetching) return;

        const fetchData = async () => {
            setIsFetching(true);
            setLoading(true);
            setError('');
            
            try {
                console.log(`Fetching brand data for ID: ${brandId}`);
                console.log('Token from localStorage:', localStorage.getItem('token'));
                
                const brandRes = await api.get(`/brands/${brandId}`);
                console.log('Brand response:', brandRes.data);
                setBrand(brandRes.data);

                const metricsRes = await api.get(`/brands/${brandId}/metrics/summary`);
                console.log('Metrics response:', metricsRes.data);
                setMetrics(metricsRes.data);

            } catch (err) {
                console.error('Error details:', err);
                console.error('Error response:', err.response);
                console.error('Error status:', err.response?.status);
                console.error('Error data:', err.response?.data);
                
                if (err.response && err.response.status === 403) {
                    // Clear invalid token and redirect to login
                    localStorage.removeItem('token');
                    router.push('/');
                    return;
                }
                
                setError('Failed to fetch brand data. Please try refreshing the page.');
            } finally {
                setLoading(false);
                setIsFetching(false);
            }
        };

        fetchData();
    }, [brandId, router]);

    // Separate effect for dashboard embedding
    useEffect(() => {
        if (!brandId || !dashboardContainer.current) return;

        // Small delay to ensure the container is ready
        const timer = setTimeout(() => {
            embedSupersetDashboard();
        }, 100);

        return () => clearTimeout(timer);
    }, [brandId, dashboardContainer.current]);

    // Reset state when brandId changes
    useEffect(() => {
        setBrand(null);
        setMetrics(null);
        setError('');
        setDashboardError('');
        setDebugInfo('');
        setIsFetching(false);
        setLoading(true);
        setDashboardLoading(true);
    }, [brandId]);

    // Manual retry function
    const handleRetry = () => {
        setError('');
        setDashboardError('');
        setDebugInfo('');
        setIsFetching(false);
        setLoading(true);
        setDashboardLoading(true);
        // The useEffect will automatically trigger a new fetch
    };

    if (error) return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>
            <button 
                onClick={handleRetry}
                style={{ 
                    padding: '10px 20px', 
                    backgroundColor: '#007bff', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer' 
                }}
            >
                Retry
            </button>
            <button 
                onClick={() => router.push('/dashboard')}
                style={{ 
                    padding: '10px 20px', 
                    backgroundColor: '#6c757d', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer',
                    marginLeft: '10px'
                }}
            >
                Back to Dashboard
            </button>
        </div>
    );

    if (!brand && loading) return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p>Loading brand data...</p>
            {isFetching && <p style={{ fontSize: '14px', color: '#666' }}>Fetching from server...</p>}
        </div>
    );

    if (!brand) return <p>No brand data found.</p>;

    return (
        <div className="container">
            <main className="main">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 className="title">{brand.name}</h1>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            onClick={() => router.push('/dashboard')}
                            style={{ 
                                padding: '8px 16px', 
                                backgroundColor: '#6c757d', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '4px', 
                                cursor: 'pointer' 
                            }}
                        >
                            Back to Dashboard
                        </button>
                    <button 
                        onClick={() => {
                            localStorage.removeItem('token');
                            router.push('/');
                        }}
                        style={{ 
                            padding: '8px 16px', 
                            backgroundColor: '#dc3545', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px', 
                            cursor: 'pointer' 
                        }}
                    >
                        Logout
                    </button>
                    </div>
                </div>

                <div style={{ marginTop: '2rem', width: '100%', maxWidth: '800px' }}>
                    <h2>Key Metrics</h2>
                    {metrics ? (
                        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                            <div>
                                <h3>Total Orders</h3>
                                <p>{metrics.totalOrders}</p>
                            </div>
                            <div>
                                <h3>Total Revenue</h3>
                                <p>${metrics.totalRevenue.toFixed(2)}</p>
                            </div>
                            <div>
                                <h3>Avg. Order Value</h3>
                                <p>${metrics.avgOrderValue.toFixed(2)}</p>
                            </div>
                            <div>
                                <h3>Active Products</h3>
                                <p>{metrics.activeProducts}</p>
                            </div>
                        </div>
                    ) : (
                        <p>Loading metrics...</p>
                    )}
                </div>

                <div style={{ marginTop: '2rem', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2>Superset Dashboard - Multiple Approaches</h2>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                onClick={() => {
                                    console.log('Loading all dashboards...');
                                    setDebugInfo('Loading all dashboards...');
                                    loadAllDashboards();
                                }}
                                style={{ 
                                    padding: '6px 12px', 
                                    backgroundColor: '#ffc107', 
                                    color: '#212529', 
                                    border: 'none', 
                                    borderRadius: '4px', 
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                Load All Dashboards
                            </button>
                            <button 
                                onClick={() => {
                                    console.log('Running comprehensive dashboard test...');
                                    setDebugInfo('Running comprehensive test...');
                                    runComprehensiveTest();
                                }}
                                style={{ 
                                    padding: '6px 12px', 
                                    backgroundColor: '#fd7e14', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '4px', 
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                Test All Approaches
                            </button>
                            <button 
                                onClick={() => window.open(`http://localhost:8088/superset/dashboard/1/`, '_blank')}
                                style={{ 
                                    padding: '6px 12px', 
                                    backgroundColor: '#28a745', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '4px', 
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                Open in New Tab
                            </button>
                            <button 
                                onClick={() => {
                                    console.log('Current debug info:', debugInfo);
                                    console.log('Dashboard container:', dashboardContainer.current);
                                    console.log('Dashboard loading state:', dashboardLoading);
                                    console.log('Dashboard error state:', dashboardError);
                                }}
                                style={{ 
                                    padding: '6px 12px', 
                                    backgroundColor: '#17a2b8', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '4px', 
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                Debug Info
                            </button>
                            <button 
                                onClick={() => {
                                    console.log('Checking available dashboards...');
                                    checkAvailableDashboards();
                                }}
                                style={{ 
                                    padding: '6px 12px', 
                                    backgroundColor: '#6f42c1', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '4px', 
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                Check Dashboards
                            </button>
                            <button 
                                onClick={async () => {
                                    console.log('Auto-detecting dashboard IDs...');
                                    const detected = await detectDashboardIds();
                                    if (detected) {
                                        setDebugInfo(`✅ Dashboard IDs detected and updated: ID=${detected.id}, UUID=${detected.uuid}`);
                                        // Reload dashboards with new IDs
                                        setTimeout(() => loadAllDashboards(), 1000);
                                    }
                                }}
                                style={{ 
                                    padding: '6px 12px', 
                                    backgroundColor: '#20c997', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '4px', 
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                Auto-Detect IDs
                            </button>
                        </div>
                    </div>
                    
                    {/* Debug Information Panel */}
                    {debugInfo && (
                        <div style={{ 
                            marginBottom: '1rem',
                            padding: '10px', 
                            backgroundColor: '#e3f2fd', 
                            borderRadius: '4px',
                            border: '1px solid #bbdefb',
                            fontSize: '14px',
                            color: '#1976d2'
                        }}>
                            <strong>Debug Info:</strong> {debugInfo}
                        </div>
                    )}
                    
                    {/* Dashboard ID Information */}
                    <div style={{ 
                        marginBottom: '1rem',
                        padding: '10px', 
                        backgroundColor: '#fff3cd', 
                        borderRadius: '4px',
                        border: '1px solid #ffeaa7',
                        fontSize: '14px',
                        color: '#856404'
                    }}>
                        <strong>Dashboard IDs:</strong>
                        <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>Current ID: <code>{DASHBOARD_ID}</code></div>
                            <div>Current UUID: <code>{DASHBOARD_UUID}</code></div>
                            {detectedDashboardId && (
                                <div>Detected ID: <code>{detectedDashboardId}</code></div>
                            )}
                            {detectedDashboardUuid && (
                                <div>Detected UUID: <code>{detectedDashboardUuid}</code></div>
                            )}
                        </div>
                    </div>
                    
                    {/* Dashboard Status Summary */}
                    <div style={{ 
                        marginBottom: '1rem',
                        padding: '10px', 
                        backgroundColor: '#f8f9fa', 
                        borderRadius: '4px',
                        border: '1px solid #dee2e6',
                        fontSize: '14px'
                    }}>
                        <strong>Dashboard Status Summary:</strong>
                        <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>🚀 SDK + UUID: <span id="status-sdk-numeric">⏳ Waiting...</span></div>
                            <div>🔧 SDK + UUID (Alt): <span id="status-sdk-uuid">⏳ Waiting...</span></div>
                            <div>🌐 Iframe + UUID: <span id="status-iframe-numeric">⏳ Waiting...</span></div>
                            <div>🔗 Iframe + UUID (Alt): <span id="status-iframe-uuid">⏳ Waiting...</span></div>
                        </div>
                    </div>
                    
                    {/* Dashboard Grid - 2x2 Layout */}
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: '20px', 
                        width: '100%' 
                    }}>
                        
                        {/* Approach 1: SDK with UUID */}
                        <div style={{ 
                            border: '2px solid #007bff', 
                            borderRadius: '8px',
                            padding: '15px',
                            backgroundColor: '#f8f9fa'
                        }}>
                            <h3 style={{ 
                                margin: '0 0 15px 0', 
                                color: '#007bff', 
                                fontSize: '16px',
                                textAlign: 'center'
                            }}>
                                🚀 SDK + UUID
                            </h3>
                            <div 
                                id="dashboard-sdk-numeric"
                                style={{ 
                                    width: '100%', 
                                    height: '300px', 
                                    border: '1px solid #ddd', 
                                    borderRadius: '4px',
                                    overflow: 'hidden',
                                    backgroundColor: 'white'
                                }}
                            />
                            <div style={{ 
                                marginTop: '10px', 
                                textAlign: 'center'
                            }}>
                                <button 
                                    onClick={() => loadSpecificDashboard('dashboard-sdk-numeric', DASHBOARD_ID, 'SDK')}
                                    style={{ 
                                        padding: '6px 12px', 
                                        backgroundColor: '#007bff', 
                                        color: 'white', 
                                        border: 'none', 
                                        borderRadius: '4px', 
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    Load This Dashboard
                                </button>
                            </div>
                        </div>
                        
                        {/* Approach 2: SDK with UUID (Alternative) */}
                        <div style={{ 
                            border: '2px solid #28a745', 
                            borderRadius: '8px',
                            padding: '15px',
                            backgroundColor: '#f8f9fa'
                        }}>
                            <h3 style={{ 
                                margin: '0 0 15px 0', 
                                color: '#28a745', 
                                fontSize: '16px',
                                textAlign: 'center'
                            }}>
                                🔧 SDK + UUID (Alt)
                            </h3>
                            <div 
                                id="dashboard-sdk-uuid"
                                style={{ 
                                    width: '100%', 
                                    height: '300px', 
                                    border: '1px solid #ddd', 
                                    borderRadius: '4px',
                                    overflow: 'hidden',
                                    backgroundColor: 'white'
                                }}
                            />
                            <div style={{ 
                                marginTop: '10px', 
                                textAlign: 'center'
                            }}>
                                <button 
                                    onClick={() => loadSpecificDashboard('dashboard-sdk-uuid', DASHBOARD_UUID, 'SDK')}
                                    style={{ 
                                        padding: '6px 12px', 
                                        backgroundColor: '#28a745', 
                                        color: 'white', 
                                        border: 'none', 
                                        borderRadius: '4px', 
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    Load This Dashboard
                                </button>
                            </div>
                        </div>
                        
                        {/* Approach 3: Iframe with UUID */}
                        <div style={{ 
                            border: '2px solid #ffc107', 
                            borderRadius: '8px',
                            padding: '15px',
                            backgroundColor: '#f8f9fa'
                        }}>
                            <h3 style={{ 
                                margin: '0 0 15px 0', 
                                color: '#ffc107', 
                                fontSize: '16px',
                                textAlign: 'center'
                            }}>
                                🌐 Iframe + UUID
                            </h3>
                            <div 
                                id="dashboard-iframe-numeric"
                                style={{ 
                                    width: '100%', 
                                    height: '300px', 
                                    border: '1px solid #ddd', 
                                    borderRadius: '4px',
                                    overflow: 'hidden',
                                    backgroundColor: 'white'
                                }}
                            />
                            <div style={{ 
                                marginTop: '10px', 
                                textAlign: 'center'
                            }}>
                                <button 
                                    onClick={() => loadSpecificDashboard('dashboard-iframe-numeric', DASHBOARD_ID, 'iframe')}
                                    style={{ 
                                        padding: '6px 12px', 
                                        backgroundColor: '#ffc107', 
                                        color: '#212529', 
                                        border: 'none', 
                                        borderRadius: '4px', 
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    Load This Dashboard
                                </button>
                            </div>
                        </div>
                        
                        {/* Approach 4: Iframe with UUID */}
                        <div style={{ 
                            border: '2px solid #fd7e14', 
                            borderRadius: '8px',
                            padding: '15px',
                            backgroundColor: '#f8f9fa'
                        }}>
                            <h3 style={{ 
                                margin: '0 0 15px 0', 
                                color: '#fd7e14', 
                                fontSize: '16px',
                                textAlign: 'center'
                            }}>
                                🔗 Iframe + UUID
                            </h3>
                            <div 
                                id="dashboard-iframe-uuid"
                                style={{ 
                                    width: '100%', 
                                    height: '300px', 
                                    border: '1px solid #ddd', 
                                    borderRadius: '4px',
                                    overflow: 'hidden',
                                    backgroundColor: 'white'
                                }}
                            />
                            <div style={{ 
                                marginTop: '10px', 
                                textAlign: 'center'
                            }}>
                                <button 
                                    onClick={() => loadSpecificDashboard('dashboard-iframe-uuid', DASHBOARD_UUID, 'iframe')}
                                    style={{ 
                                        padding: '6px 12px', 
                                        backgroundColor: '#fd7e14', 
                                        color: 'white', 
                                        border: 'none', 
                                        borderRadius: '4px', 
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    Load This Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Original Single Dashboard Container (Hidden by default) */}
                    <div style={{ display: 'none' }}>
                        <div 
                            ref={dashboardContainer} 
                            style={{ 
                                width: '100%', 
                                height: '100%',
                                display: dashboardLoading || dashboardError ? 'none' : 'block'
                            }}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
