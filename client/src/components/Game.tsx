import { useState, useEffect } from 'react';
import StreetViewPanel from './StreetViewPanel';
import GuessMap from './GuessMap';
import './Game.css';

interface GameProps {
  gameId: string;
  userId: string;
  campus: string;
  currentRound: number;
  totalRounds: number;
  gameMode: string;
  onGameComplete: () => void;
  onBackToMenu: () => void;
}

interface Location {
  lat: number;
  lng: number;
}

function Game({ gameId, userId, campus, currentRound, totalRounds, gameMode, onGameComplete, onBackToMenu }: GameProps) {
  const [streetViewLocation, setStreetViewLocation] = useState<Location | null>(null);
  const [guessLocation, setGuessLocation] = useState<Location | null>(null);
  const [hasGuessed, setHasGuessed] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [round, setRound] = useState(currentRound);
  const [mapKey, setMapKey] = useState(0);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  // Load Google Maps script
  useEffect(() => {
    if (window.google) {
      setMapsLoaded(true);
      return;
    }

    // Fetch API key from backend
    fetch('http://localhost:5001/api/maps-key')
      .then(res => res.json())
      .then(data => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${data.key}`;
        script.async = true;
        script.defer = true;
        script.onload = () => setMapsLoaded(true);
        document.head.appendChild(script);
      });
  }, []);

  useEffect(() => {
    if (mapsLoaded) {
      fetchStreetViewLocation();
    }
  }, [gameId, round, mapsLoaded]);

  // Timer countdown
  useEffect(() => {
    if (hasGuessed || showResult) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasGuessed, showResult]);

  // Spacebar to submit
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && guessLocation && !hasGuessed && !showResult) {
        e.preventDefault();
        handleSubmitGuess();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [guessLocation, hasGuessed, showResult]);

  const fetchStreetViewLocation = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/game/${gameId}/streetview`);
      const data = await response.json();
      setStreetViewLocation(data.location);
      setMapKey(prev => prev + 1);
    } catch (error) {
      console.error('Error fetching Street View:', error);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (!hasGuessed) {
      setGuessLocation({ lat, lng });
    }
  };

  const handleSubmitGuess = async () => {
    if (!guessLocation || hasGuessed) return;

    try {
      const response = await fetch('http://localhost:5001/api/game/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          guessLat: guessLocation.lat,
          guessLng: guessLocation.lng,
          userId,
          timeTaken: 60 - timeRemaining
        })
      });

      const data = await response.json();
      console.log('Full response:', data); // ← ADD THIS
      
      if (data.error) {
        console.error('Backend error:', data.error);
        alert(`Error: ${data.error}`);
        return;
      }

      setResult(data);
      setHasGuessed(true);
      setShowResult(true);
    } catch (error) {
      console.error('Error submitting guess:', error);
      alert('Failed to submit guess - check console');
    }
  };

  const handleTimeUp = async () => {
    if (hasGuessed) return;

    if (guessLocation) {
      await handleSubmitGuess();
    } else {
      setResult({
        distance: 999999,
        points: 0,
        actualLocation: streetViewLocation,
        guessLocation: null
      });
      setHasGuessed(true);
      setShowResult(true);
    }
  };

  const handleNextRound = async () => {
    if (round >= totalRounds) {
      await completeGame();
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/game/${gameId}/next-round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      setRound(data.currentRound);
      setGuessLocation(null);
      setHasGuessed(false);
      setResult(null);
      setShowResult(false);
      setTimeRemaining(60);
      
      // ← ADD THIS: Fetch the new Street View location
      await fetchStreetViewLocation();
    } catch (error) {
      console.error('Error getting next round:', error);
    }
  };

  const completeGame = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/game/${gameId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      await response.json();
      onGameComplete();
    } catch (error) {
      console.error('Error completing game:', error);
    }
  };

  const getTimerPercentage = () => (timeRemaining / 60) * 100;

  const getTimerColor = () => {
    const percentage = getTimerPercentage();
    if (percentage <= 25) return '#ff4444';
    if (percentage <= 50) return '#ffaa00';
    return '#4ecca3';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!mapsLoaded || !streetViewLocation) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading location...</p>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="timer-bar-container">
        <button className="exit-button" onClick={onBackToMenu} title="Exit to Menu">
          ✕
        </button>
        <div 
          key={round}
          className="timer-bar" 
          style={{ 
            width: `${getTimerPercentage()}%`,
            backgroundColor: getTimerColor(),
            transition: timeRemaining === 60 ? 'none' : 'width 1s linear, background-color 0.3s ease'
          }}
        />
        <div className="timer-text">
          Round {round}/{totalRounds} • {campus.toUpperCase()} • {formatTime(timeRemaining)}
        </div>
      </div>

      <div className="game-layout">
        <div className="streetview-container">
          <StreetViewPanel 
            key={`streetview-${round}-${streetViewLocation?.lat}`}
            location={streetViewLocation} 
            gameMode={gameMode} 
          />
        </div>

        <div className="map-wrapper">
          <div className="map-container">
            <GuessMap
              key={mapKey}
              onMapClick={handleMapClick}
              guessLocation={guessLocation}
              actualLocation={hasGuessed ? result?.actualLocation : null}
              hasGuessed={hasGuessed}
              selectedCampus={campus}
            />
            
            <div className="guess-controls">
              {guessLocation && !hasGuessed && (
                <button className="submit-button" onClick={handleSubmitGuess}>
                  Submit Guess
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showResult && result && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '3rem',
            borderRadius: '16px',
            textAlign: 'center',
            maxWidth: '500px'
          }}>
            <h2>Round {round} Result</h2>
            <p style={{ fontSize: '1.5rem', color: '#666', margin: '1rem 0' }}>
              Distance: {result.distance ? result.distance.toFixed(0) : 'N/A'}m
            </p>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#4ecca3', margin: '1rem 0' }}>
              {result.points ?? 0} points
            </p>
            {result.error && (
              <p style={{ color: 'red' }}>{result.error}</p>
            )}
            <button
              onClick={handleNextRound}
              style={{
                marginTop: '2rem',
                padding: '1rem 3rem',
                fontSize: '1.3rem',
                fontWeight: 'bold',
                background: '#4ecca3',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer'
              }}
            >
              {round >= totalRounds ? 'Finish Game' : 'Next Round →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Game;