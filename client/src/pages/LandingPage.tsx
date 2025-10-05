import { type FC, useState } from 'react';
import LoginForm from '../components/LoginForm';

const LandingPage: FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (email: string, username: string, password: string) => {
        setIsLoading(true);
        setError('');
        
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    username,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Registration successful
                console.log('Registration successful:', data);
                // Store token, redirect user, etc.
                localStorage.setItem('token', data.token);
                // window.location.href = '/dashboard'; // or use router
            } else {
                // Registration failed
                setError(data.message || 'Registration failed');
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="landing-page">
            <LoginForm onSubmit={handleLogin} />
            {isLoading && <p>Registering...</p>}
            {error && <p className="error">{error}</p>}
        </div>
    );
};

export default LandingPage;