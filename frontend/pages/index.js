import { useState } from 'react';
import { useRouter } from 'next/router';
import api from '../lib/axios';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
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
        }
    };

    return (
        <div className="container">
            <main className="main">
                <h1 className="title">
                    Welcome to Brand Dashboard
                </h1>

                <div style={{ marginTop: '2rem' }}>
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', width: '300px' }}>
                        <h2>Login</h2>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{ padding: '10px', marginBottom: '10px' }}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ padding: '10px', marginBottom: '10px' }}
                        />
                        <button type="submit" style={{ padding: '10px', cursor: 'pointer' }}>Login</button>
                        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                    </form>
                    
                    <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px', maxWidth: '300px' }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Default Login Credentials:</h3>
                        <p style={{ margin: '5px 0', fontSize: '12px' }}><strong>Email:</strong> om-stage@ausmit.in</p>
                        <p style={{ margin: '5px 0', fontSize: '12px' }}><strong>Password:</strong> password</p>
                    </div>
                    
                    <div style={{ marginTop: '2rem' }}>
                        <button 
                            onClick={async () => {
                                const token = localStorage.getItem('token');
                                console.log('Current token:', token ? token.substring(0, 20) + '...' : 'No token');
                                if (token) {
                                    try {
                                        const response = await api.get('/brands');
                                        console.log('Test API call successful:', response.data);
                                        alert('Token is working! Found ' + response.data.length + ' brands');
                                    } catch (err) {
                                        console.error('Test API call failed:', err);
                                        if (err.response?.status === 403) {
                                            alert('Token is invalid (403 Forbidden). Please login again.');
                                            localStorage.removeItem('token');
                                        } else {
                                            alert('Token test failed: ' + err.message);
                                        }
                                    }
                                } else {
                                    alert('No token found in localStorage');
                                }
                            }}
                            style={{ 
                                padding: '10px', 
                                backgroundColor: '#007bff', 
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
                                console.log('Token cleared');
                                alert('Token cleared from localStorage');
                            }}
                            style={{ 
                                padding: '10px', 
                                backgroundColor: '#6c757d', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '4px', 
                                cursor: 'pointer' 
                            }}
                        >
                            Clear Token
                        </button>
                        
                        <button 
                            onClick={async () => {
                                try {
                                    const response = await api.post('/auth/login', { 
                                        email: 'om-stage@ausmit.in', 
                                        password: 'password' 
                                    });
                                    if (response.data.accessToken) {
                                        localStorage.setItem('token', response.data.accessToken);
                                        alert('Auto-login successful! Token stored.');
                                    }
                                } catch (err) {
                                    alert('Auto-login failed: ' + err.message);
                                }
                            }}
                            style={{ 
                                padding: '10px', 
                                backgroundColor: '#28a745', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '4px', 
                                cursor: 'pointer',
                                marginLeft: '10px'
                            }}
                        >
                            Auto-Login
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
