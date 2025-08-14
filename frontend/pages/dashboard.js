import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api from '../lib/axios';
import Link from 'next/link';

export default function DashboardPage() {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        // Check if user is authenticated
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
            return;
        }

        const fetchBrands = async () => {
            try {
                const response = await api.get('/brands');
                setBrands(response.data);
            } catch (err) {
                setError('Failed to fetch brands.');
                console.error(err);
                if (err.response && err.response.status === 403) {
                    // Clear invalid token and redirect to login
                    localStorage.removeItem('token');
                    router.push('/');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchBrands();
    }, [router]);

    if (loading) return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ marginBottom: '10px' }}>🔄</div>
            <p>Loading your brands...</p>
        </div>
    );
    
    if (error) return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>
        </div>
    );

    return (
        <div className="container">
            <main className="main">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 className="title">Your Brand Dashboard</h1>
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

                <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Welcome to Brand Analytics</h3>
                    <p style={{ margin: '0', color: '#6c757d', fontSize: '14px' }}>
                        Select a brand below to view detailed analytics, metrics, and interactive dashboards powered by Apache Superset.
                    </p>
                </div>

                <div style={{ marginTop: '2rem', width: '100%' }}>
                    {brands.length > 0 ? (
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
                            gap: '20px' 
                        }}>
                            {brands.map(brand => (
                                <div key={brand.id} style={{ 
                                    border: '1px solid #e9ecef', 
                                    padding: '20px', 
                                    borderRadius: '8px',
                                    backgroundColor: 'white',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                }}
                                >
                                    <Link href={`/brand/${brand.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <div style={{ marginBottom: '15px' }}>
                                            <h2 style={{ 
                                                margin: '0 0 8px 0', 
                                                color: '#212529',
                                                fontSize: '1.5rem'
                                            }}>
                                                {brand.name}
                                            </h2>
                                            <p style={{ 
                                                margin: '0', 
                                                color: '#6c757d',
                                                fontSize: '0.9rem',
                                                fontWeight: '500'
                                            }}>
                                                {brand.brandCode}
                                            </p>
                                        </div>
                                        
                                        <div style={{ 
                                            display: 'grid', 
                                            gridTemplateColumns: '1fr 1fr', 
                                            gap: '10px',
                                            marginBottom: '15px'
                                        }}>
                                            <div style={{ textAlign: 'center', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                                                <div style={{ fontSize: '0.8rem', color: '#6c757d', marginBottom: '4px' }}>Type</div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#495057' }}>
                                                    {brand.brandType}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'center', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                                                <div style={{ fontSize: '0.8rem', color: '#6c757d', marginBottom: '4px' }}>Rating</div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#495057' }}>
                                                    {'⭐'.repeat(brand.rating)}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div style={{ 
                                            padding: '10px', 
                                            backgroundColor: '#e3f2fd', 
                                            borderRadius: '4px',
                                            textAlign: 'center',
                                            color: '#1976d2',
                                            fontSize: '0.9rem',
                                            fontWeight: '500'
                                        }}>
                                            📊 View Analytics & Dashboard
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ 
                            textAlign: 'center', 
                            padding: '3rem', 
                            backgroundColor: '#f8f9fa', 
                            borderRadius: '8px',
                            color: '#6c757d'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                            <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>No Brands Available</h3>
                            <p style={{ margin: '0' }}>You don't have access to any brands at the moment.</p>
                        </div>
                    )}
                </div>

                <div style={{ 
                    marginTop: '3rem', 
                    padding: '1.5rem', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>🚀 What You Can Do</h3>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                        gap: '15px' 
                    }}>
                        <div style={{ padding: '10px' }}>
                            <div style={{ fontSize: '1.2rem', marginBottom: '5px' }}>📈</div>
                            <strong>View Analytics</strong>
                            <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#6c757d' }}>
                                Access detailed metrics and performance data for each brand
                            </p>
                        </div>
                        <div style={{ padding: '10px' }}>
                            <div style={{ fontSize: '1.2rem', marginBottom: '5px' }}>📊</div>
                            <strong>Interactive Dashboards</strong>
                            <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#6c757d' }}>
                                Explore interactive charts and visualizations powered by Superset
                            </p>
                        </div>
                        <div style={{ padding: '10px' }}>
                            <div style={{ fontSize: '1.2rem', marginBottom: '5px' }}>🔍</div>
                            <strong>Real-time Data</strong>
                            <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#6c757d' }}>
                                Get up-to-date information from your MongoDB database
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
