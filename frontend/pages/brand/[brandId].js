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

    // Correct dashboard ID from your backend - use numeric ID, not UUID
    const DASHBOARD_ID = "1"; // Use the numeric ID that works in Superset
    const DASHBOARD_UUID = "df2a444a-8df2-43ae-bae6-d61c4a717956"; // Keep UUID for reference

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
                name: 'SDK with Numeric ID',
                method: () => trySDKApproach(container, embedToken, DASHBOARD_ID)
            },
            {
                name: 'SDK with UUID',
                method: () => trySDKApproach(container, embedToken, DASHBOARD_UUID)
            },
            {
                name: 'Iframe with Numeric ID',
                method: () => tryIframeApproach(container, embedToken, DASHBOARD_ID)
            },
            {
                name: 'Iframe with UUID',
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
        
        if (typeof embedDashboard !== 'function') {
            throw new Error('embedDashboard function not available');
        }

        const result = await embedDashboard({
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
        
        // Check if content was actually loaded
        if (container.children.length > 0) {
            setDebugInfo(`SDK approach successful with ID: ${dashboardId}`);
            return true;
        } else {
            throw new Error('SDK returned success but no content loaded');
        }
    };

    // Try iframe approach with given dashboard ID
    const tryIframeApproach = async (container, embedToken, dashboardId) => {
        setDebugInfo(`Attempting iframe approach with ID: ${dashboardId}`);
        
        // Clear container
        container.innerHTML = '';
        
        // Create iframe
        const iframe = document.createElement('iframe');
        
        // Try different URL formats
        const urls = [
            `http://localhost:8088/superset/dashboard/${dashboardId}/?embedded=true&token=${embedToken}`,
            `http://localhost:8088/superset/dashboard/${dashboardId}/?embedded=true`,
            `http://localhost:8088/superset/dashboard/${dashboardId}/`,
        ];

        for (const url of urls) {
            try {
                console.log(`Trying iframe URL: ${url}`);
                iframe.src = url;
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.title = 'Superset Dashboard';
                
                container.appendChild(iframe);
                
                // Wait a bit to see if iframe loads
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Check if iframe loaded successfully
                if (iframe.contentDocument && iframe.contentDocument.body) {
                    setDebugInfo(`Iframe approach successful with ID: ${dashboardId}`);
                    return true;
                }
            } catch (err) {
                console.log(`Iframe URL ${url} failed:`, err.message);
                // Try next URL
            }
        }
        
        throw new Error('All iframe URLs failed');
    };

    // Load specific dashboard in specific container
    const loadSpecificDashboard = async (containerId, dashboardId, approach) => {
        try {
            setDebugInfo(`Loading ${approach} dashboard with ID: ${dashboardId} in container: ${containerId}`);
            
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
                    if (typeof embedDashboard !== 'function') {
                        throw new Error('SDK not available');
                    }

                    const result = await embedDashboard({
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
                } catch (err) {
                    console.log(`${containerId} SDK failed:`, err.message);
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
            }

        } catch (err) {
            console.error(`Error loading ${containerId}:`, err);
            setDebugInfo(`❌ ${containerId} failed: ${err.message}`);
            
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
        setDebugInfo(`SDK Status: ${typeof embedDashboard === 'function' ? 'Available' : 'NOT AVAILABLE'}`);
        
        // Force check container after a longer delay to ensure DOM is ready
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
                                    console.log('Testing comprehensive dashboard loading...');
                                    setDebugInfo('Testing comprehensive approach...');
                                    // Test the comprehensive dashboard loading approach
                                    const container = dashboardContainer.current;
                                    if (container && brandId) {
                                        // Create a test token for testing
                                        const testToken = 'test-token-for-testing';
                                        tryMultipleDashboardApproaches(container, testToken)
                                            .then(() => {
                                                setDebugInfo('Comprehensive test completed!');
                                            })
                                            .catch(err => {
                                                setDebugInfo(`Comprehensive test failed: ${err.message}`);
                                            });
                                    } else {
                                        setDebugInfo('Container or brandId not available for test');
                                    }
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
                    
                    {/* Dashboard Grid - 2x2 Layout */}
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: '20px', 
                        width: '100%' 
                    }}>
                        
                        {/* Approach 1: SDK with Numeric ID */}
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
                                🚀 SDK + Numeric ID (1)
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
                        
                        {/* Approach 2: SDK with UUID */}
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
                                🔧 SDK + UUID
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
                        
                        {/* Approach 3: Iframe with Numeric ID */}
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
                                🌐 Iframe + Numeric ID (1)
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
