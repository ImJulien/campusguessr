import { type FC, useState } from 'react';
import LoginForm from '../components/LoginForm';
import './LandingPage.css';

interface User {
  id: string;
  username: string;
  email: string;
  emailVerified?: boolean;
  school?: {
    name: string;
    acronym: string;
    badge: string;
  };
  xp: number;
  level: number;
  stats: {
    totalGames: number;
    completedGames: number;
    totalPoints: number;
    averageScore: number;
    recentGames: Array<{
      id: string;
      startedAt: string;
      completedAt: string | null;
      totalPoints: number;
      rounds: number;
    }>;
  };
}

interface LandingPageProps {
  onLogin: (user: User, token: string) => void;
}

const LandingPage: FC<LandingPageProps> = ({ onLogin }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoginMode, setIsLoginMode] = useState(false);

    const handleSubmit = async (email: string, username: string, password: string) => {
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        
        try {
            const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';
            const body = isLoginMode 
                ? { email, password }
                : { email, username, password };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (response.ok) {
                console.log(`${isLoginMode ? 'Login' : 'Registration'} successful:`, data);
                if (!isLoginMode && data.message) {
                    // Show success message for registration
                    setSuccessMessage(data.message);
                    // Don't auto-login for registration, wait for email verification
                } else {
                    // Auto-login for login requests
                    onLogin(data.user, data.token);
                }
            } else {
                setError(data.error || `${isLoginMode ? 'Login' : 'Registration'} failed`);
            }
        } catch (err) {
            console.error(`${isLoginMode ? 'Login' : 'Registration'} error:`, err);
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="landing-page">
            <div className="auth-toggle">
                <button 
                    className={!isLoginMode ? 'active' : ''}
                    onClick={() => {
                        setIsLoginMode(false);
                        setError('');
                        setSuccessMessage('');
                    }}
                >
                    Register
                </button>
                <button 
                    className={isLoginMode ? 'active' : ''}
                    onClick={() => {
                        setIsLoginMode(true);
                        setError('');
                        setSuccessMessage('');
                    }}
                >
                    Login
                </button>
            </div>
            <LoginForm 
                onSubmit={handleSubmit} 
                isLoginMode={isLoginMode}
            />
            {isLoading && <p>{isLoginMode ? 'Logging in...' : 'Registering...'}</p>}
            {error && <p className="error">{error}</p>}
            {successMessage && (
                <div style={{
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    border: '1px solid rgba(76, 175, 80, 0.3)',
                    color: '#4caf50',
                    padding: '1rem',
                    borderRadius: '4px',
                    marginTop: '1rem',
                    textAlign: 'center'
                }}>
                    {successMessage}
                </div>
            )}
        </div>
    );
};

export default LandingPage;