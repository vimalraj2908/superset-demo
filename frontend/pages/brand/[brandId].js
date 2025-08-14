import { useRouter } from 'next/router';
import { useEffect, useState, createRef } from 'react';
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
    const dashboardContainer = createRef();

    // Correct dashboard UUID from your backend
    const DASHBOARD_UUID = "df2a444a-8df2-43ae-bae6-d61c4a717956";

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

        const embedSupersetDashboard = async () => {
            try {
                setDashboardLoading(true);
                setDashboardError('');

                console.log('Fetching guest token for dashboard...');
                const tokenRes = await api.get(`/brands/${brandId}/reports/iframe`);
                console.log('Token response:', tokenRes.data);
                
                const embedToken = tokenRes.data.token;
                console.log('Embed token received:', embedToken.substring(0, 20) + '...');

                // Clear previous dashboard content
                if (dashboardContainer.current) {
                    dashboardContainer.current.innerHTML = '';
                }

                // Embed the dashboard using the SDK
                await embedDashboard({
                    id: DASHBOARD_UUID,
                    supersetDomain: "http://localhost:8088",
                    mountPoint: dashboardContainer.current,
                    fetchGuestToken: () => Promise.resolve(embedToken),
                    dashboardUiConfig: {
                        hideTitle: true,
                        hideChartControls: false,
                        hideTab: false,
                        hideEditControls: true,
                    },
                });

                console.log('Dashboard embedded successfully');
                setDashboardLoading(false);

            } catch (err) {
                console.error('Dashboard embedding error:', err);
                setDashboardError('Failed to load dashboard. Please try refreshing the page.');
                setDashboardLoading(false);
            }
        };

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
        setIsFetching(false);
        setLoading(true);
        setDashboardLoading(true);
    }, [brandId]);

    // Manual retry function
    const handleRetry = () => {
        setError('');
        setDashboardError('');
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
                        <h2>Superset Dashboard</h2>
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
                    </div>
                    
                    <div style={{ 
                        width: '100%', 
                        height: '600px', 
                        border: '1px solid #ddd', 
                        borderRadius: '4px',
                        overflow: 'hidden'
                    }}>
                        {dashboardLoading && (
                            <div style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                justifyContent: 'center', 
                                alignItems: 'center', 
                                height: '100%',
                                color: '#666'
                            }}>
                                <div style={{ marginBottom: '10px' }}>🔄</div>
                                <p>Loading Superset Dashboard...</p>
                            </div>
                        )}
                        
                        {dashboardError && (
                            <div style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                justifyContent: 'center', 
                                alignItems: 'center', 
                                height: '100%',
                                color: '#dc3545',
                                textAlign: 'center',
                                padding: '20px'
                            }}>
                                <div style={{ marginBottom: '10px' }}>❌</div>
                                <p>{dashboardError}</p>
                                <button 
                                    onClick={handleRetry}
                                    style={{ 
                                        marginTop: '10px',
                                        padding: '8px 16px', 
                                        backgroundColor: '#007bff', 
                                        color: 'white', 
                                        border: 'none', 
                                        borderRadius: '4px', 
                                        cursor: 'pointer' 
                                    }}
                                >
                                    Retry Dashboard
                                </button>
                            </div>
                        )}
                        
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
