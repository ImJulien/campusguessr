import { useState, useEffect } from 'react'
import './App.css'

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
      <h1>Title</h1>
      <p>Server Status: {status}</p>
    </div>
  )
}

export default App