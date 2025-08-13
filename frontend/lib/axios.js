import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:8080/api',
    timeout: 10000
});

instance.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    console.log('Axios interceptor - Token:', token ? token.substring(0, 20) + '...' : 'No token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Axios interceptor - Headers set:', config.headers.Authorization ? 'Yes' : 'No');
    } else {
        console.log('Axios interceptor - No token found');
    }
    return config;
});

instance.interceptors.response.use(
    response => {
        console.log('Axios response success:', response.status, response.config.url);
        return response;
    },
    error => {
        console.log('Axios response error:', error.response?.status, error.config?.url, error.message);
        
        // Handle JWT signature errors specifically
        if (error.response?.status === 403) {
            console.log('403 Forbidden - likely JWT issue, clearing token');
            localStorage.removeItem('token');
            // Redirect to login if we're not already there
            if (typeof window !== 'undefined' && window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }
        
        return Promise.reject(error);
    }
);

export default instance;
