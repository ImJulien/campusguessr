import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoadScript } from '@react-google-maps/api';
import Game from './components/Game';
import StartScreen from './components/StartScreen';
import ResultsScreen from './components/ResultsScreen';
import SettingsPage from './components/SettingsPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import { type RoundScore, type Location } from './types/game';
import AudioManager from './utils/audioManager';
import './App.css';

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

const libraries: ("places")[] = ['places'];

const App: React.FC = () => {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'results'>('start');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [roundScores, setRoundScores] = useState<RoundScore[]>([]);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [selectedCampus, setSelectedCampus] = useState<string>('sfu');
  const [gameMode, setGameMode] = useState<'move' | 'nmpz'>('move');
  const [user, setUser] = useState<User | null>(null);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState<boolean>(false);
  const maxRounds = 5;

  const audioManager = AudioManager.getInstance();

  // Initialize audio and check for existing token on app load
  useEffect(() => {
    const initializeApp = async () => {
      audioManager.initializeFromStorage();
      
      const token = localStorage.getItem('token');
      if (token) {
        await fetchUserProfile(token);
      }
    };
    
    initializeApp();
  }, []);

  // Enable audio context and start background music on first user interaction
  useEffect(() => {
    const enableAudio = () => {
      if (!hasUserInteracted) {
        audioManager.enableAudioContext();
        // Start background music immediately on first interaction
        audioManager.startBackgroundMusic();
        setHasUserInteracted(true);
      }
    };

    // Add event listeners for user interaction
    document.addEventListener('click', enableAudio, { once: true });
    document.addEventListener('keydown', enableAudio, { once: true });
    document.addEventListener('touchstart', enableAudio, { once: true });

    return () => {
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
    };
  }, [hasUserInteracted]);

  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch('/api/db/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      localStorage.removeItem('token');
    }
  };

  const handleLogin = (userData: User, token: string) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Prevent browser zoom
  useEffect(() => {
    const preventZoom = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    const preventKeyboardZoom = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', preventZoom, { passive: false });
    window.addEventListener('keydown', preventKeyboardZoom, { passive: false });

    return () => {
      window.removeEventListener('wheel', preventZoom);
      window.removeEventListener('keydown', preventKeyboardZoom);
    };
  }, []);

  const handleStartGame = async (campus: string, mode: string = 'move'): Promise<void> => {
    try {
      // Start a new game in the database
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch('/api/db/game/start', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ campus })
        });

        if (response.ok) {
          const { gameId } = await response.json();
          setCurrentGameId(gameId);
        }
      }

      setSelectedCampus(campus);
      setGameMode(mode as 'move' | 'nmpz');
      setGameState('playing');
      setTotalScore(0);
      setRoundScores([]);
      setCurrentRound(1);
    } catch (error) {
      console.error('Failed to start game:', error);
      // Continue with game even if database save fails
      setSelectedCampus(campus);
      setGameMode(mode as 'move' | 'nmpz');
      setGameState('playing');
      setTotalScore(0);
      setRoundScores([]);
      setCurrentRound(1);
    }
  };

  const handleRoundComplete = async (score: number, distance: number, actualLocation: Location, guessLocation: Location | null): Promise<void> => {
    const newRoundScore: RoundScore = { 
      round: currentRound, 
      score, 
      distance,
      actualLocation: { lat: actualLocation.lat, lng: actualLocation.lng },
      guessLocation: guessLocation ? { lat: guessLocation.lat, lng: guessLocation.lng } : undefined
    };
    
    // Save score to database
    try {
      const token = localStorage.getItem('token');
      if (token && currentGameId) {
        await fetch(`/api/db/game/${currentGameId}/score`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            round: currentRound,
            points: score,
            distance,
            actualLocation: [actualLocation.lat, actualLocation.lng],
            guessedLocation: guessLocation ? [guessLocation.lat, guessLocation.lng] : null
          })
        });
      }
    } catch (error) {
      console.error('Failed to save score:', error);
    }
    
    setRoundScores(prevRoundScores => [...prevRoundScores, newRoundScore]);
    let newTotal = totalScore + score;
    setTotalScore(newTotal);

    if (currentRound >= maxRounds) {
      // Complete the game in database
      await completeGame(newTotal);
      setGameState('results');
    } else {
      setCurrentRound(currentRound + 1);
    }
  };

  const completeGame = async (finalScore: number): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      if (token && currentGameId) {
        // Calculate grade based on score
        const getGrade = (score: number): string => {
          if (score >= 40000) return 'S';
          if (score >= 35000) return 'A';
          if (score >= 30000) return 'B';
          if (score >= 20000) return 'C';
          if (score >= 10000) return 'D';
          return 'F';
        };

        const response = await fetch(`/api/db/game/${currentGameId}/complete`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            grade: getGrade(finalScore),
            totalScore: finalScore
          })
        });

        if (response.ok) {
          // Refresh user data to update stats
          fetchUserProfile(token);
        }
      }
    } catch (error) {
      console.error('Failed to complete game:', error);
    }
  };

  const handlePlayAgain = (): void => {
    handleStartGame(selectedCampus, gameMode);
  };

  const handleBackToMenu = (): void => {
    setGameState('start');
    setTotalScore(0);
    setRoundScores([]);
    setCurrentRound(1);
  };

  const handleOpenSettings = (): void => {
    setShowSettings(true);
  };

  const handleBackFromSettings = (): void => {
    setShowSettings(false);
  };

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; // Changed from GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return (
      <div className="error-container">
        <h1>⚠️ Configuration Error</h1>
        <p>Please add your Google Maps API key to the .env file</p>
        <code>VITE_GOOGLE_MAPS_API_KEY=your_key_here</code> {/* Updated the example */}
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/*" element={
        <LoadScript googleMapsApiKey={apiKey} libraries={libraries}>
          <div className={`App ${showSettings ? 'settings-open' : ''}`}>
            <div className="app-content">
              {gameState === 'start' && (
                <StartScreen 
                  onStart={handleStartGame} 
                  onOpenSettings={handleOpenSettings} 
                  user={user}
                  onLogin={handleLogin}
                  onLogout={handleLogout}
                />
              )}
              
              {gameState === 'playing' && (
                <Game 
                  onRoundComplete={handleRoundComplete}
                  currentRound={currentRound}
                  maxRounds={maxRounds}
                  selectedCampus={selectedCampus}
                  gameMode={gameMode}
                  onBackToMenu={handleBackToMenu}
                  totalScore={totalScore}
                />
              )}
              
              {gameState === 'results' && (
                <ResultsScreen 
                  totalScore={totalScore}
                  // @ts-ignore
                  roundScores={roundScores}
                  onPlayAgain={handlePlayAgain}
                  onBackToMenu={handleBackToMenu}
                  selectedCampus={selectedCampus}
                />
              )}
            </div>            {showSettings && (
              <SettingsPage onBack={handleBackFromSettings} />
            )}
          </div>
        </LoadScript>
      } />
    </Routes>
  );
};

export default App;