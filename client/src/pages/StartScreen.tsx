import { useState } from 'react';
import './StartScreen.css';

interface StartScreenProps {
  onStart: (campusId: string, gameMode: string) => void;
}

function StartScreen({ onStart }: StartScreenProps) {
  const [selectedCampus, setSelectedCampus] = useState('sfu');
  const [gameMode, setGameMode] = useState('move'); // 'move' or 'nmpz'

  const campuses = [
    { id: 'sfu', name: 'Simon Fraser University', shortName: 'SFU', color: '#CC0633' },
    { id: 'ubc', name: 'University of British Columbia', shortName: 'UBC', color: '#002145' },
    { id: 'uvic', name: 'University of Victoria', shortName: 'UVic', color: '#005493' },
    { id: 'bcit', name: 'BCIT', shortName: 'BCIT', color: '#003C71' },
    { id: 'langara', name: 'Langara College', shortName: 'Langara', color: '#8B0000' },
    { id: 'douglas', name: 'Douglas College', shortName: 'Douglas', color: '#007A33' },
    { id: 'queens', name: "Queen's University", shortName: "Queen's", color: '#002452' },
    { id: 'uofa', name: 'University of Alberta', shortName: 'UofA', color: '#007C41' },
    { id: 'ucalgary', name: 'University of Calgary', shortName: 'UofC', color: '#C8102E' },
    { id: 'uoft', name: 'University of Toronto', shortName: 'UofT', color: '#00204E' },
    { id: 'waterloo', name: 'University of Waterloo', shortName: 'UofW', color: '#FFD54F' },
    { id: 'mcgill', name: 'McGill University', shortName: 'McGill', color: '#ED1B2F' },
    { id: 'mcmaster', name: 'McMaster University', shortName: 'Mac', color: '#7A003C' },
    { id: 'udem', name: 'Université de Montréal', shortName: 'UdeM', color: '#0275BB' },
    { id: 'guelph', name: 'University of Guelph', shortName: 'Guelph', color: '#C6093B' }
  ];

  const handleSignIn = () => {
    // TODO: Backend - Handle sign in
    console.log('Sign in clicked');
  };

  const handleSignUp = () => {
    // TODO: Backend - Handle sign up
    console.log('Sign up clicked');
  };

interface Campus {
    id: string;
    name: string;
    shortName: string;
    color: string;
}

const handleCampusSelect = (campusId: Campus['id']): void => {
    setSelectedCampus(campusId);
    // TODO: Backend - Save selected campus preference
    console.log('Selected campus:', campusId);
};

  const handleStartGame = () => {
    // Use the currently selected (displayed) campus and game mode
    onStart(selectedCampus, gameMode);
  };

  return (
    <div className="start-screen">
      <header className="app-header">
        <div 
          className="header-left"
        >
          <button className="account-button">
            Account
          </button>
        </div>
        <div className="header-right">
          <button className="signin-button" onClick={handleSignIn}>
            Sign In
          </button>
          <button className="signup-button" onClick={handleSignUp}>
            Sign Up
          </button>
        </div>
      </header>
      <div className="start-content">
        <h1 className="title">CampusExplorer</h1>
        <p className="subtitle">Explore Canadian Universities</p>
        
        <div className="selectors-row">
          <div className="info-box">
            <h2>How to Play</h2>
            <ul>
              <li>You'll be placed at a random campus location</li>
              <li>Look around using Street View</li>
              <li>Click on the map to make your guess</li>
              <li>Submit to see how close you were!</li>
            </ul>
          </div>

          <div className="selectors-column">
            <div className="game-mode-selector">
              <h3 className="selector-title">Game Mode</h3>
              <div className="mode-options">
                <button 
                  className={`mode-button ${gameMode === 'move' ? 'active' : ''}`}
                  onClick={() => setGameMode('move')}
                >
                  <div className="mode-name">Move</div>
                  <div className="mode-description">Full movement and zoom</div>
                </button>
                <button 
                  className={`mode-button ${gameMode === 'nmpz' ? 'active' : ''}`}
                  onClick={() => setGameMode('nmpz')}
                >
                  <div className="mode-name">NMPZ</div>
                  <div className="mode-description">No Move, Pan, or Zoom</div>
                </button>
              </div>
            </div>

            <div className="campus-selector">
              <h3 className="selector-title">Select Campus</h3>
              <div className="carousel-container">
                <button 
                  className="carousel-arrow left" 
                  onClick={() => {
                    const currentIndex = campuses.findIndex(c => c.id === selectedCampus);
                    const prevIndex = currentIndex > 0 ? currentIndex - 1 : campuses.length - 1;
                    handleCampusSelect(campuses[prevIndex].id);
                  }}
                  aria-label="Previous campus"
                >
                  ‹
                </button>
                
                <div className="campus-carousel-wrapper">
                  <div 
                    className="campus-carousel"
                    style={{
                      transform: `translateX(-${campuses.findIndex(c => c.id === selectedCampus) * 100}%)`
                    }}
                  >
                    {campuses.map((campus) => {
                      const nameLength = campus.shortName.length;
                      const extraChars = Math.max(0, nameLength - 6);
                      const fontSize = `${2.5 - (extraChars * 0.0625)}rem`; // 0.0625rem = ~1px reduction per char
                      const size = 150 + (extraChars * 5); // +5px per extra character
                      
                      return (
                        <div
                          key={campus.id}
                          className="campus-card"
                          onClick={() => handleCampusSelect(campus.id)}
                        >
                          <div 
                            className="campus-icon" 
                            style={{ 
                              backgroundColor: campus.color,
                              fontSize: fontSize,
                              width: `${size}px`,
                              height: `${size}px`
                            }}
                          >
                            {campus.shortName}
                          </div>
                          <div className="campus-name">{campus.name}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <button 
                  className="carousel-arrow right" 
                  onClick={() => {
                    const currentIndex = campuses.findIndex(c => c.id === selectedCampus);
                    const nextIndex = currentIndex < campuses.length - 1 ? currentIndex + 1 : 0;
                    handleCampusSelect(campuses[nextIndex].id);
                  }}
                  aria-label="Next campus"
                >
                  ›
                </button>
              </div>
              <div className="campus-indicator">
                {campuses.map((campus) => (
                  <div
                    key={campus.id}
                    className={`indicator-dot ${selectedCampus === campus.id ? 'active' : ''}`}
                    onClick={() => handleCampusSelect(campus.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <button className="start-button" onClick={handleStartGame}>
          Start Game
        </button>
      </div>
    </div>
  );
}

export default StartScreen;
