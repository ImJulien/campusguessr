import React, { useState } from 'react';
import AudioManager from '../utils/audioManager';
import './AccountDropdown.css';

interface AuthFormProps {
  onSubmit: (email: string, username: string, password: string) => void;
  isLoginMode: boolean;
  isLoading: boolean;
  error: string;
}

const AuthForm: React.FC<AuthFormProps> = ({ onSubmit, isLoginMode, isLoading, error }) => {
  const [email, setEmail] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, username, password);
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="form-group">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="form-input"
        />
      </div>
      
      {!isLoginMode && (
        <div className="form-group">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="form-input"
          />
        </div>
      )}
      
      <div className="form-group">
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="form-input"
        />
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <button type="submit" disabled={isLoading} className="form-submit">
        {isLoading ? 'Loading...' : (isLoginMode ? 'Sign In' : 'Sign Up')}
      </button>
    </form>
  );
};

interface AccountDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  user: {
    username: string;
    email?: string;
    level?: number;
    xp?: number;
    emailVerified?: boolean;
    school?: {
      name: string;
      acronym: string;
      badge: string;
    };
    stats?: {
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
  } | null;
  onLogin: (userData: any, token: string) => void;
  onLogout: () => void;
}

const AccountDropdown: React.FC<AccountDropdownProps> = ({ 
  isOpen, 
  onOpenSettings, 
  user, 
  onLogin, 
  onLogout 
}) => {
  const audioManager = AudioManager.getInstance();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showLoginForm, setShowLoginForm] = useState<boolean>(false);
  const [isLoginMode, setIsLoginMode] = useState<boolean>(true);

  const handleAuthSubmit = async (email: string, username: string, password: string) => {
    setIsLoading(true);
    setError('');
    
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
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        onLogin(data.user, data.token);
        setShowLoginForm(false);
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Authentication failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetAuthState = () => {
    setShowLoginForm(false);
    setError('');
    setIsLoading(false);
  };

  const handleShowSignIn = () => {
    setIsLoginMode(true);
    setShowLoginForm(true);
    setError('');
  };

  const handleShowSignUp = () => {
    setIsLoginMode(false);
    setShowLoginForm(true);
    setError('');
  };

  const handleToggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError('');
  };

  if (!isOpen) return null;

  // User is logged in - show user stats and options
  if (user) {
    return (
      <div className="account-dropdown">
        <div className="dropdown-header">
          <div className="username-container">
            <h3>{user.username}</h3>
            {user.school && user.emailVerified && (
              <img 
                src={user.school.badge} 
                alt={`${user.school.name} badge`}
                className="school-badge"
                title={`Verified ${user.school.name} student`}
              />
            )}
          </div>
          <p>Level {user.level || 1} • {user.xp || 0} XP</p>
          {!user.emailVerified && (
            <p className="verification-notice">⚠️ Please verify your email</p>
          )}
        </div>
        
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-label">Average Score</div>
            <div className="stat-value">{user.stats?.averageScore || 0}</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-label">Games Completed</div>
            <div className="stat-value">{user.stats?.completedGames || 0}</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-label">Total Points</div>
            <div className="stat-value">{(user.stats?.totalPoints || 0).toLocaleString()}</div>
          </div>
        </div>
        
        <div className="dropdown-buttons">
          <button className="settings-button" onClick={() => {
            audioManager.playClick();
            onOpenSettings();
          }}>
            Settings
          </button>
          <button className="logout-button" onClick={() => {
            audioManager.playClick();
            onLogout();
          }}>
            Logout
          </button>
        </div>
      </div>
    );
  }

  // User is not logged in - show auth form or buttons
  if (showLoginForm) {
    return (
      <div className="account-dropdown">
        <div className="dropdown-header auth-header">
          <div className="auth-header-left">
            <h3>{isLoginMode ? 'Sign In' : 'Sign Up'}</h3>
          </div>
          <div className="auth-header-right">
            <button className="back-button" onClick={() => {
              audioManager.playClick();
              resetAuthState();
            }}>
              ←
            </button>
          </div>
        </div>
        
        <div className="auth-form-container">
          <AuthForm 
            onSubmit={handleAuthSubmit}
            isLoginMode={isLoginMode}
            isLoading={isLoading}
            error={error}
          />
          
          <div className="auth-toggle-container">
            <p>
              {isLoginMode ? "Don't have an account? " : "Already have an account? "}
              <button 
                className="auth-toggle-link"
                onClick={() => {
                  audioManager.playClick();
                  handleToggleMode();
                }}
              >
                {isLoginMode ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show sign in/sign up buttons
  return (
    <div className="account-dropdown">
      <div className="dropdown-header">
        <h3>Welcome to CampusExplorer</h3>
        <p>Sign in to track your progress</p>
      </div>
      
      <div className="auth-buttons-container">
        <button 
          className="auth-button signin-button"
          onClick={() => {
            audioManager.playClick();
            handleShowSignIn();
          }}
        >
          Sign In
        </button>
        <button 
          className="auth-button signup-button"
          onClick={() => {
            audioManager.playClick();
            handleShowSignUp();
          }}
        >
          Sign Up
        </button>
      </div>
    </div>
  );
};

export default AccountDropdown;