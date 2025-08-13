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

    if (loading) return <p>Loading...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div className="container">
            <main className="main">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 className="title">Your Brands</h1>
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
                <div style={{ marginTop: '2rem', width: '100%', maxWidth: '600px' }}>
                    {brands.length > 0 ? (
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {brands.map(brand => (
                                <li key={brand.id} style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
                                    <Link href={`/brand/${brand.id}`} style={{ textDecoration: 'none', color: 'blue' }}>
                                        <h2>{brand.name}</h2>
                                        <p>{brand.brandCode}</p>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>You don't have access to any brands.</p>
                    )}
                </div>
            </main>
        </div>
    );
}
