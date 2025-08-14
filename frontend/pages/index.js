import { useState } from 'react';
import { useRouter } from 'next/router';
import api from '../lib/axios';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            console.log('Attempting login with email:', email);
            
            // Clear any existing token first
            localStorage.removeItem('token');
            
            // Use a simpler email for the user to type
            const response = await api.post('/auth/login', { email: email, password: password });
            console.log('Login response:', response.data);
            
            if (response.data.accessToken) {
                console.log('Storing token:', response.data.accessToken.substring(0, 20) + '...');
                localStorage.setItem('token', response.data.accessToken);
                
                // Verify the token works by making a test call
                try {
                    const testResponse = await api.get('/brands');
                    console.log('Token verification successful:', testResponse.data);
                    console.log('Token stored, redirecting to dashboard');
                    router.push('/dashboard');
                } catch (testErr) {
                    console.error('Token verification failed:', testErr);
                    localStorage.removeItem('token');
                    setError('Login successful but token validation failed. Please try again.');
                }
            } else {
                setError('Invalid response from server - no access token received');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Failed to login. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <main className="main">
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚀</div>
                    <h1 className="title" style={{ marginBottom: '0.5rem' }}>
                        Brand Analytics Dashboard
                    </h1>
                    <p style={{ 
                        fontSize: '1.1rem', 
                        color: '#6c757d', 
                        margin: '0',
                        maxWidth: '600px',
                        marginLeft: 'auto',
                        marginRight: 'auto'
                    }}>
                        Access comprehensive analytics, interactive dashboards, and real-time insights for your brands
                    </p>
                </div>

                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'flex-start',
                    gap: '3rem',
                    flexWrap: 'wrap'
                }}>
                    {/* Login Form */}
                    <div style={{ 
                        backgroundColor: 'white', 
                        padding: '2rem', 
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #e9ecef',
                        minWidth: '350px'
                    }}>
                        <h2 style={{ 
                            margin: '0 0 1.5rem 0', 
                            textAlign: 'center',
                            color: '#212529'
                        }}>
                            Sign In
                        </h2>
                        
                        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ 
                                    display: 'block', 
                                    marginBottom: '0.5rem', 
                                    fontWeight: '500',
                                    color: '#495057'
                                }}>
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    style={{ 
                                        width: '100%',
                                        padding: '12px', 
                                        border: '1px solid #ced4da',
                                        borderRadius: '6px',
                                        fontSize: '1rem',
                                        boxSizing: 'border-box'
                                    }}
                                    disabled={loading}
                                />
                            </div>
                            
                            <div>
                                <label style={{ 
                                    display: 'block', 
                                    marginBottom: '0.5rem', 
                                    fontWeight: '500',
                                    color: '#495057'
                                }}>
                                    Password
                                </label>
                                <input
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    style={{ 
                                        width: '100%',
                                        padding: '12px', 
                                        border: '1px solid #ced4da',
                                        borderRadius: '6px',
                                        fontSize: '1rem',
                                        boxSizing: 'border-box'
                                    }}
                                    disabled={loading}
                                />
                            </div>
                            
                            <button 
                                type="submit" 
                                disabled={loading}
                                style={{ 
                                    padding: '12px', 
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    backgroundColor: loading ? '#6c757d' : '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '1rem',
                                    fontWeight: '500',
                                    marginTop: '0.5rem'
                                }}
                            >
                                {loading ? 'Signing In...' : 'Sign In'}
                            </button>
                            
                            {error && (
                                <div style={{ 
                                    padding: '10px', 
                                    backgroundColor: '#f8d7da', 
                                    color: '#721c24', 
                                    borderRadius: '4px',
                                    fontSize: '0.9rem',
                                    textAlign: 'center'
                                }}>
                                    {error}
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Information Panel */}
                    <div style={{ 
                        backgroundColor: '#f8f9fa', 
                        padding: '2rem', 
                        borderRadius: '12px',
                        border: '1px solid #e9ecef',
                        minWidth: '350px'
                    }}>
                        <h3 style={{ 
                            margin: '0 0 1.5rem 0', 
                            color: '#495057',
                            textAlign: 'center'
                        }}>
                            🔑 Demo Credentials
                        </h3>
                        
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ 
                                padding: '1rem', 
                                backgroundColor: 'white', 
                                borderRadius: '8px',
                                border: '1px solid #dee2e6'
                            }}>
                                <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>Admin User</h4>
                                <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>
                                    <strong>Email:</strong> om-stage@ausmit.in
                                </p>
                                <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>
                                    <strong>Password:</strong> password
                                </p>
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ 
                                padding: '1rem', 
                                backgroundColor: 'white', 
                                borderRadius: '8px',
                                border: '1px solid #dee2e6'
                            }}>
                                <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>Test User</h4>
                                <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>
                                    <strong>Email:</strong> test@example.com
                                </p>
                                <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>
                                    <strong>Password:</strong> password123
                                </p>
                            </div>
                        </div>

                        <div style={{ 
                            padding: '1rem', 
                            backgroundColor: '#e3f2fd', 
                            borderRadius: '8px',
                            border: '1px solid #bbdefb'
                        }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>🚀 What's Inside</h4>
                            <ul style={{ 
                                margin: '0', 
                                paddingLeft: '1.2rem', 
                                fontSize: '0.9rem',
                                color: '#1976d2'
                            }}>
                                <li>5 Brands with different types</li>
                                <li>64+ Users with various roles</li>
                                <li>Interactive Superset dashboards</li>
                                <li>Real-time analytics & metrics</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Test Token Section */}
                <div style={{ 
                    marginTop: '3rem', 
                    textAlign: 'center',
                    padding: '1rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#495057' }}>🧪 Test Your Connection</h3>
                    <button 
                        onClick={async () => {
                            const token = localStorage.getItem('token');
                            console.log('Current token:', token ? token.substring(0, 20) + '...' : 'No token');
                            if (token) {
                                try {
                                    const response = await api.get('/brands');
                                    console.log('Test API call successful:', response.data);
                                    alert('✅ Token is working! Found ' + response.data.length + ' brands');
                                } catch (err) {
                                    console.error('Test API call failed:', err);
                                    if (err.response?.status === 403) {
                                        alert('❌ Token is invalid (403 Forbidden). Please login again.');
                                        localStorage.removeItem('token');
                                    } else {
                                        alert('❌ Token test failed: ' + err.message);
                                    }
                                }
                            } else {
                                alert('ℹ️ No token found. Please login first.');
                            }
                        }}
                        style={{ 
                            padding: '8px 16px', 
                            backgroundColor: '#28a745', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px', 
                            cursor: 'pointer',
                            marginRight: '10px'
                        }}
                    >
                        Test Token
                    </button>
                    
                    <button 
                        onClick={() => {
                            localStorage.removeItem('token');
                            alert('Token cleared!');
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
                        Clear Token
                    </button>
                </div>
            </main>
        </div>
    );
}
