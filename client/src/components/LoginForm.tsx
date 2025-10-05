import { useState, type FormEvent } from 'react'
import './LoginForm.css'

interface LoginFormProps {
  onSubmit: (email: string, username: string, password: string) => void;
  isLoginMode: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, isLoginMode }) => {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(email, username, password)
  }

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>{isLoginMode ? 'Login' : 'Register'}</h2>
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {!isLoginMode && (
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="submit-button">
          {isLoginMode ? 'Login' : 'Register'}
        </button>
      </form>
    </div>
  )
}

export default LoginForm