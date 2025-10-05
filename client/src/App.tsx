import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import LandingPage from './pages/LandingPage'
import VerifyEmailPage from './pages/VerifyEmailPage'

function App() {
  const [status, setStatus] = useState('Loading...')

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setStatus(data.status))
      .catch(err => setStatus('Error: ' + err.message))
  }, [])

  return (
    <div>
      <p>Server Status: {status}</p>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/verify" element={<VerifyEmailPage />} />
        </Routes>
    </BrowserRouter>
    </div>
  )
}

export default App