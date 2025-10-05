import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

interface VerificationResult {
  message: string;
  user?: {
    emailVerified: boolean;
    studentVerified: boolean;
    school?: {
      name: string;
      acronym: string;
      badge: string;
    };
  };
}

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [verificationData, setVerificationData] = useState<VerificationResult | null>(null)
  const hasRun = useRef(false) // Add this ref

  useEffect(() => {
    // Prevent double execution
    if (hasRun.current) return
    hasRun.current = true

    const token = searchParams.get('token')
    
    if (!token) {
      setStatus('error')
      setMessage('No verification token provided')
      return
    }

    // Call your backend verification endpoint
    const verifyEmail = async () => {
      try {
        console.log('Attempting to verify with token:', token);
        const response = await fetch(`/api/email/verify?token=${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        console.log('Response status:', response.status);
        const data = await response.json()
        console.log('Response data:', data);

        if (response.ok) {
          setStatus('success')
          setMessage(data.message || 'Email verified successfully!')
          setVerificationData(data)
        } else {
          setStatus('error')
          setMessage(data.error || 'Verification failed')
        }
      } catch (error) {
        console.error('Verification error:', error)
        setStatus('error')
        setMessage('Network error occurred. Please ensure the server is running.')
      }
    }

    verifyEmail()
  }, []) // Remove searchParams from dependencies - only run once

  const handleContinue = () => {
    navigate('/');
  };

  return (
    <div className="verify-page" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '15px',
        padding: '40px',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
      }}>
        {status === 'loading' && (
          <>
            <div style={{
              width: '50px',
              height: '50px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <h2 style={{ color: '#333', marginBottom: '10px' }}>Verifying your email...</h2>
            <p style={{ color: '#666' }}>Please wait while we verify your account.</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>✅</div>
            <h2 style={{ color: '#333', marginBottom: '15px' }}>Email Verified Successfully!</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>{message}</p>
            
            {verificationData?.user?.school && verificationData.user.studentVerified && (
              <div style={{
                background: '#f0f8ff',
                border: '2px solid #667eea',
                borderRadius: '10px',
                padding: '20px',
                margin: '20px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                <img 
                  src={verificationData.user.school.badge} 
                  alt={`${verificationData.user.school.name} badge`}
                  style={{
                    width: '50px',
                    height: '50px',
                    objectFit: 'contain'
                  }}
                />
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ color: '#667eea', margin: '0 0 5px 0' }}>🎓 School Badge Unlocked!</h3>
                  <p style={{ color: '#333', margin: 0, fontSize: '0.9rem' }}>
                    You've received the <strong>{verificationData.user.school.name}</strong> badge for verifying your student email!
                  </p>
                </div>
              </div>
            )}
            
            <button 
              onClick={handleContinue}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 30px',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Continue to CampusGuessr
            </button>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>❌</div>
            <h2 style={{ color: '#333', marginBottom: '15px' }}>Verification Failed</h2>
            <p style={{ color: '#e74c3c', marginBottom: '20px' }}>{message}</p>
            <button 
              onClick={handleContinue}
              style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '12px 30px',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Back to Home
            </button>
          </>
        )}
      </div>
      
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}

export default VerifyEmailPage