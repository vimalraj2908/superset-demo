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
    const dashboardContainer = createRef();

    const MAX_RETRIES = 2;

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

                // Fetch the guest token from the backend
                const tokenRes = await api.get(`/brands/${brandId}/reports/iframe`);
                console.log('Token response:', tokenRes.data);
                const embedToken = tokenRes.data.token;

                // Embed the dashboard using the SDK
                if (dashboardContainer.current) {
                    embedDashboard({
                        id: "1", // The same UUID used in the backend
                        supersetDomain: "http://localhost:8088",
                        mountPoint: dashboardContainer.current,
                        fetchGuestToken: () => Promise.resolve(embedToken),
                        dashboardUiConfig: {
                            hideTitle: true,
                            hideChartControls: true,
                            hideTab: true,
                        },
                    });
                }

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
    }, [brandId, router]); // Simplified dependencies

    // Reset state when brandId changes
    useEffect(() => {
        setBrand(null);
        setMetrics(null);
        setError('');
        setIsFetching(false);
        setLoading(true);
    }, [brandId]);

    // Manual retry function
    const handleRetry = () => {
        setError('');
        setIsFetching(false);
        setLoading(true);
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

                <div style={{ marginTop: '2rem', width: '100%', height: '600px', border: '1px solid #ddd' }}>
                    <h2>Superset Dashboard</h2>
                    <div ref={dashboardContainer} style={{ width: '100%', height: '100%' }}>
                        {loading && <p>Loading dashboard...</p>}
                    </div>
                </div>
            </main>
        </div>
    );
}
