import React, { useState, useEffect } from 'react';
import StreetViewPanel from './StreetViewPanel';
import GuessMap from './GuessMap';
import ResultModal from './ResultModal';
import { campusLocations, generateRandomLocation } from '../data/locations';
import { calculateScore, calculateDistance, calculateCampusSize } from '../utils/scoring';
import AudioManager from '../utils/audioManager';
import './Game.css';

interface Location {
  lat: number;
  lng: number;
  heading?: number;
  pitch?: number;
}

interface Location {
  lat: number;
  lng: number;
  heading?: number;
  pitch?: number;
}

interface GameProps {
  onRoundComplete: (score: number, distance: number, actualLocation: Location, guessLocation: Location | null) => void;
  currentRound: number;
  maxRounds: number;
  selectedCampus: string;
  gameMode?: 'move' | 'nmpz';
  onBackToMenu: () => void;
  totalScore?: number;
}

const Game: React.FC<GameProps> = ({ 
  onRoundComplete, 
  currentRound, 
  maxRounds, 
  selectedCampus, 
  gameMode = 'move', 
  onBackToMenu, 
  totalScore = 0 
}) => {
  const audioManager = AudioManager.getInstance();
  const [actualLocation, setActualLocation] = useState<Location | null>(null);
  const [guessLocation, setGuessLocation] = useState<Location | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [distance, setDistance] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [hasGuessed, setHasGuessed] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(60); // 1 minute = 60 seconds
  const [mapKey, setMapKey] = useState<number>(0); // Key to force map re-render

  // Timer countdown
  useEffect(() => {
    if (hasGuessed || showResult) return; // Don't run timer after guessing
    
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Time's up! Auto-submit will be handled by the next effect
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasGuessed, showResult]);

  // Handle auto-submit when time runs out
  useEffect(() => {
    if (timeRemaining === 0 && !hasGuessed && !showResult) {
      handleTimeUp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining, hasGuessed, showResult]);

  // Spacebar to submit guess
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && guessLocation && !hasGuessed && !showResult) {
        e.preventDefault();
        handleSubmitGuess();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guessLocation, hasGuessed, showResult]);

  // Load a random location when component mounts or round changes
  useEffect(() => {
    loadRandomLocation();
    // Start in-game music for each new round
    const audioManager = AudioManager.getInstance();
    audioManager.stopBackgroundMusic(); // Stop menu music
    audioManager.startGameMusic(); // Start game music
    
    // Cleanup function to stop game music when component unmounts
    return () => {
      audioManager.stopGameMusic();
      audioManager.startBackgroundMusic(); // Restart menu music
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRound]);

  const loadRandomLocation = (): void => {
    // TODO: Call backend API to get random location
    // Generate random coordinates within campus bounds and verify Street View coverage
    const maxAttempts = 20; // Try up to 20 times to find a location with Street View
    let attempts = 0;
    
    const tryGenerateLocation = () => {
      attempts++;
      const randomLocation = generateRandomLocation(selectedCampus);
      
      if (!randomLocation) {
        console.error('Failed to generate random location');
        return;
      }

      // Check if Street View is available at this location
      const streetViewService = new window.google.maps.StreetViewService();
      const STREETVIEW_MAX_DISTANCE = 100; // meters

      streetViewService.getPanorama(
        {
          location: { lat: randomLocation.lat, lng: randomLocation.lng },
          radius: STREETVIEW_MAX_DISTANCE,
          source: window.google.maps.StreetViewSource.OUTDOOR
        },
        (data, status) => {
          if (status === 'OK' && data?.location?.latLng) {
            // Street View found! Use this location
            const finalLocation: Location = {
              lat: data.location.latLng.lat(),
              lng: data.location.latLng.lng(),
              heading: randomLocation.heading,
              pitch: randomLocation.pitch
            };
            
            setActualLocation(finalLocation);
            setGuessLocation(null);
            setShowResult(false);
            setHasGuessed(false);
            setTimeRemaining(60); // Reset timer to 1 minute
            setMapKey(prev => prev + 1); // Force map to re-render
          } else {
            // No Street View coverage, try again
            if (attempts < maxAttempts) {
              tryGenerateLocation();
            } else {
              console.error('Could not find Street View coverage after multiple attempts');
              // Fallback to campus center as last resort
              setActualLocation({
                lat: campusLocations[selectedCampus].center.lat,
                lng: campusLocations[selectedCampus].center.lng,
                heading: 0,
                pitch: 0
              });
              setGuessLocation(null);
              setShowResult(false);
              setHasGuessed(false);
              setTimeRemaining(60); // Reset timer
              setMapKey(prev => prev + 1); // Force map to re-render
            }
          }
        }
      );
    };

    tryGenerateLocation();
  };

  const exitFullscreen = (): void => {
    // Exit fullscreen if any element is in fullscreen mode
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => {
        console.error('Error exiting fullscreen:', err);
      });
    } else if ((document as any).webkitFullscreenElement) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).mozFullScreenElement) {
      (document as any).mozCancelFullScreen();
    } else if ((document as any).msFullscreenElement) {
      (document as any).msExitFullscreen();
    }
  };

  const handleTimeUp = (): void => {
    // Time expired - auto submit with current guess or score 0 if no guess
    if (hasGuessed || !actualLocation) return; // Already submitted
    
    // Stop game music when time expires
    const audioManager = AudioManager.getInstance();
    audioManager.stopGameMusic();
    
    // Exit fullscreen if active
    exitFullscreen();
    
    if (guessLocation) {
      // Has a guess - submit it (without re-exiting fullscreen)
      const dist = calculateDistance(
        actualLocation.lat,
        actualLocation.lng,
        guessLocation.lat,
        guessLocation.lng
      );

      const campusData = campusLocations[selectedCampus];
      const campusMaxDistance = calculateCampusSize(campusData.bounds);
      const roundScore = calculateScore(dist, campusMaxDistance);

      setDistance(dist);
      setScore(roundScore);
      setHasGuessed(true);
      setShowResult(true);
    } else {
      // No guess made - score 0
      setDistance(999999); // Max distance
      setScore(0);
      setHasGuessed(true);
      setShowResult(true);
    }
  };

  const handleMapClick = (location: Location): void => {
    if (!hasGuessed) {
      setGuessLocation(location);
    }
  };

  const handleSubmitGuess = (): void => {
    if (!guessLocation || hasGuessed || !actualLocation) return;

    // Stop game music when guess is submitted
    const audioManager = AudioManager.getInstance();
    audioManager.stopGameMusic();

    // Exit fullscreen if active (e.g., if mini-map is in fullscreen)
    exitFullscreen();

    const dist = calculateDistance(
      actualLocation.lat,
      actualLocation.lng,
      guessLocation.lat,
      guessLocation.lng
    );

    const campusData = campusLocations[selectedCampus];
    const campusMaxDistance = calculateCampusSize(campusData.bounds);
    const roundScore = calculateScore(dist, campusMaxDistance);

    setDistance(dist);
    setScore(roundScore);
    setHasGuessed(true);
    setShowResult(true);
  };

  const handleNextRound = (): void => {
    if (actualLocation) {
      onRoundComplete(score, distance, actualLocation, guessLocation);
    }
    setShowResult(false);
  };

  const getTimerPercentage = (): number => {
    return (timeRemaining / 60) * 100; // Calculate percentage of time remaining
  };

  const getTimerColor = (): string => {
    const percentage = getTimerPercentage();
    if (percentage <= 25) return '#ff4444'; // Red when <= 15 seconds
    if (percentage <= 50) return '#ffaa00'; // Orange when <= 30 seconds
    return '#4ecca3'; // Green otherwise
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!actualLocation) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading location...</p>
      </div>
    );
  }

  return (
    <div className="game-container">
      {/* Timer bar replaces the header */}
      <div className="timer-bar-container">
        <button className="exit-button" onClick={() => {
          audioManager.playClick();
          onBackToMenu();
        }} title="Exit to Menu">
          ✕
        </button>
        <div 
          key={currentRound}
          className="timer-bar" 
          style={{ 
            width: `${getTimerPercentage()}%`,
            backgroundColor: getTimerColor(),
            transition: timeRemaining === 60 ? 'none' : 'width 1s linear, background-color 0.3s ease'
          }}
        />
        <div className="timer-text">
          Round {currentRound}/{maxRounds} • {campusLocations[selectedCampus]?.shortName || campusLocations[selectedCampus]?.name || 'Campus'} • {formatTime(timeRemaining)}
        </div>
        <div className="score-display">
          {totalScore.toLocaleString()} pts
        </div>
      </div>

      <div className="game-layout">
        <div className="streetview-container">
          <StreetViewPanel location={actualLocation} gameMode={gameMode} />
        </div>

        <div className="map-wrapper">
          <div className="map-container">
            <GuessMap
              key={mapKey}
              onMapClick={handleMapClick}
              guessLocation={guessLocation}
              hasGuessed={hasGuessed}
              selectedCampus={selectedCampus}
            />
            
            <div className="guess-controls">
              {guessLocation && !hasGuessed && (
                <button className="submit-button" onClick={() => {
                  audioManager.playClick();
                  handleSubmitGuess();
                }}>
                  Submit Guess
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showResult && actualLocation && (
        <ResultModal
          distance={distance}
          score={score}
          onNext={handleNextRound}
          isLastRound={currentRound >= maxRounds}
          guessLocation={guessLocation}
          actualLocation={actualLocation}
          selectedCampus={selectedCampus}
        />
      )}
    </div>
  );
};

export default Game;