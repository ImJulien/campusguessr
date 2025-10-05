import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import LandingPage from './pages/LandingPage'
import StartScreen from './pages/StartScreen'
import Game from './components/Game'

function App() {
  const [status, setStatus] = useState('Loading...')
  const [gameStarted, setGameStarted] = useState(false)
  const [gameId, setGameId] = useState('')
  const [userId, setUserId] = useState('d892867b-198f-4703-8766-fe1402833aff') // TODO: Get from login
  const [selectedCampus, setSelectedCampus] = useState('')
  const [gameMode, setGameMode] = useState('')
  const [currentRound, setCurrentRound] = useState(1)
  const [totalRounds, setTotalRounds] = useState(5)

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setStatus(data.status))
      .catch(err => setStatus('Error: ' + err.message))
  }, [])

  const handleStartGame = async (campusId: string, mode: string) => {
    try {
      // Call backend to start game
      const response = await fetch('http://localhost:5001/api/game/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          campus: campusId,
          rounds: 5
        })
      });

      const data = await response.json();

      if (data.gameId) {
        setGameId(data.gameId);
        setSelectedCampus(data.campus);
        setCurrentRound(data.currentRound);
        setTotalRounds(data.totalRounds);
        setGameMode(mode);
        setGameStarted(true);
        console.log('Game started:', data);
      } else {
        console.error('Failed to start game:', data);
        alert('Failed to start game!');
      }
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Error connecting to server!');
    }
  };

  const handleGameComplete = () => {
    setGameStarted(false);
    // TODO: Show results screen
  };

  return (
    <div>
      <h1>Title</h1>
      <p>Server Status: {status}</p>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
      {!gameStarted ? (
        <StartScreen onStart={handleStartGame} />
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Game
            gameId={gameId}
            userId={userId}
            campus={selectedCampus}
            currentRound={currentRound}
            totalRounds={totalRounds}
            gameMode={gameMode}
            onGameComplete={handleGameComplete}
            onBackToMenu={() => setGameStarted(false)}
          />
        </div>
      )}
    </div>
  )
}

export default App