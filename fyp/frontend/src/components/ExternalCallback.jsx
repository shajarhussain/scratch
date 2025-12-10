import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const ExternalCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('Verifying access...');
    const [error, setError] = useState('');

    useEffect(() => {
        const validateToken = async () => {
            const token = searchParams.get('token');

            if (!token) {
                setError('No access token provided');
                setStatus('Access Denied');
                return;
            }

            try {
                const { data } = await axios.post(
                    'http://127.0.0.1:5000/api/external/validate-access',
                    { token }
                );

                // Store token and user info
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify({
                    _id: data._id,
                    name: data.name,
                    email: data.email,
                    role: data.role
                }));

                setStatus('Access granted! Redirecting...');

                // Redirect to dashboard after 1 second
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);

            } catch (error) {
                setError(error.response?.data?.message || 'Invalid or expired access link');
                setStatus('Access Denied');
            }
        };

        validateToken();
    }, [searchParams, navigate]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: '#f5f5f5'
        }}>
            <div style={{
                padding: '40px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                textAlign: 'center',
                maxWidth: '500px'
            }}>
                <h1 style={{ marginBottom: '20px' }}>External Evaluator Access</h1>
                <p style={{ fontSize: '18px', marginBottom: '10px' }}>{status}</p>
                {error && (
                    <div style={{
                        marginTop: '20px',
                        padding: '15px',
                        backgroundColor: '#f8d7da',
                        border: '1px solid #f5c6cb',
                        borderRadius: '4px',
                        color: '#721c24'
                    }}>
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExternalCallback;
