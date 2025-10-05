import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
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
        const response = await fetch(`/api/email/verify?token=${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage(data.message || 'Email verified successfully!')
        } else {
          setStatus('error')
          setMessage(data.error || 'Verification failed')
        }
      } catch (error) {
        console.error('Verification error:', error)
        setStatus('error')
        setMessage('Network error occurred')
      }
    }

    verifyEmail()
  }, []) // Remove searchParams from dependencies - only run once

  return (
    <div className="verify-page">
      <h1>Email Verification</h1>
      
      {status === 'loading' && (
        <p>Verifying your email...</p>
      )}
      
      {status === 'success' && (
        <div>
          <p style={{ color: 'green' }}>{message}</p>
          <a href="/">Go to Home</a>
        </div>
      )}
      
      {status === 'error' && (
        <div>
          <p style={{ color: 'red' }}>{message}</p>
          <a href="/">Go to Home</a>
        </div>
      )}
    </div>
  )
}

export default VerifyEmailPage