import React, { useState } from 'react';
import AccountDropdown from './AccountDropdown.tsx';
import CampusDetailModal from './CampusDetailModal.tsx';
import RecentGamesDropdown from './RecentGamesDropdown.tsx';
import ErrorBoundary from './ErrorBoundary.tsx';
import { campusLocations } from '../data/locations';
import { calculateCampusSize } from '../utils/scoring';
import AudioManager from '../utils/audioManager';
import treeBgGif from '../assets/backgrounds/CSP_Tree_BG.gif';
import './StartScreen.css';

interface Campus {
  id: string;
  name: string;
  shortName: string;
  color: string;
  difficulty: string;
}

interface StartScreenProps {
  onStart: (campusId: string, gameMode: string) => void;
  onOpenSettings: () => void;
  user: {
    username: string;
    level: number;
    xp: number;
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
  } | null;
  onLogin: (userData: any, token: string) => void;
  onLogout: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart, onOpenSettings, user, onLogin, onLogout }) => {
  const [selectedCampus, setSelectedCampus] = useState<string | null>(null);
  const [showAccountDropdown, setShowAccountDropdown] = useState<boolean>(false);
  const [showRecentGamesDropdown, setShowRecentGamesDropdown] = useState<boolean>(false);

  const [selectedDifficulty, setSelectedDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [showCampusModal, setShowCampusModal] = useState<boolean>(false);
  const [modalCampusData, setModalCampusData] = useState<{
    campus: Campus;
    sRankThreshold: number;
    campusMaxDistance: number;
  } | null>(null);

  const audioManager = AudioManager.getInstance();

  const campuses: Campus[] = [
    { id: 'sfu', name: 'Simon Fraser University', shortName: 'SFU', color: '#CC0633', difficulty: campusLocations.sfu.difficulty },
    { id: 'ubc', name: 'University of British Columbia', shortName: 'UBC', color: '#002145', difficulty: campusLocations.ubc.difficulty },
    { id: 'uvic', name: 'University of Victoria', shortName: 'UVic', color: '#005493', difficulty: campusLocations.uvic.difficulty },
    { id: 'bcit', name: 'BCIT', shortName: 'BCIT', color: '#003C71', difficulty: campusLocations.bcit.difficulty },
    { id: 'langara', name: 'Langara College', shortName: 'Langara', color: '#8B0000', difficulty: campusLocations.langara.difficulty },
    { id: 'queens', name: "Queen's University", shortName: "Queen's", color: '#002452', difficulty: campusLocations.queens.difficulty },
    { id: 'uofa', name: 'University of Alberta', shortName: 'UofA', color: '#007C41', difficulty: campusLocations.uofa.difficulty },
    { id: 'ucalgary', name: 'University of Calgary', shortName: 'UofC', color: '#C8102E', difficulty: campusLocations.ucalgary.difficulty },
    { id: 'uoft', name: 'University of Toronto', shortName: 'UofT', color: '#00204E', difficulty: campusLocations.uoft.difficulty },
    { id: 'waterloo', name: 'University of Waterloo', shortName: 'UofW', color: '#FFD54F', difficulty: campusLocations.waterloo.difficulty },
    { id: 'mcgill', name: 'McGill University', shortName: 'McGill', color: '#ED1B2F', difficulty: campusLocations.mcgill.difficulty },
    { id: 'mcmaster', name: 'McMaster University', shortName: 'Mac', color: '#7A003C', difficulty: campusLocations.mcmaster.difficulty },
    { id: 'udem', name: 'Université de Montréal', shortName: 'UdeM', color: '#0275BB', difficulty: campusLocations.udem.difficulty },
    { id: 'guelph', name: 'University of Guelph', shortName: 'Guelph', color: '#C6093B', difficulty: campusLocations.guelph.difficulty }
  ];

  const handleOpenSettings = (): void => {
    onOpenSettings();
  };

  const handleAccountHover = (): void => {
    if (!showAccountDropdown) {
      setShowAccountDropdown(true);
      setShowRecentGamesDropdown(false); // Close other dropdown
    }
  };

  const handleAccountLeave = (): void => {
    if (showAccountDropdown) {
      setShowAccountDropdown(false);
    }
  };

  const handleRecentGamesHover = (): void => {
    if (!showRecentGamesDropdown) {
      setShowRecentGamesDropdown(true);
      setShowAccountDropdown(false); // Close other dropdown
    }
  };

  const handleRecentGamesLeave = (): void => {
    if (showRecentGamesDropdown) {
      setShowRecentGamesDropdown(false);
    }
  };



  const handleCampusSelect = (campus: Campus, sRankThreshold: number, campusMaxDistance: number): void => {
    audioManager.playClick();
    setSelectedCampus(campus.id);
    setModalCampusData({ campus, sRankThreshold, campusMaxDistance });
    setShowCampusModal(true);
    // TODO: Backend - Save selected campus preference
    console.log('Selected campus:', campus.id);
  };

  const handleCloseModal = (): void => {
    setShowCampusModal(false);
    setModalCampusData(null);
    setSelectedCampus(null); // Reset selection when modal closes
  };

  const handleStartFromModal = (campusId: string, gameMode: string): void => {
    setShowCampusModal(false);
    onStart(campusId, gameMode);
  };

  return (
    <div className="start-screen" style={{ backgroundImage: `url(${treeBgGif}), linear-gradient(to bottom, #1a1464 0%, #2e1f5e 15%, #4a2c5a 30%, #6b3d56 45%, #8b4e51 60%, #a65f4c 75%, #bf7047 85%, #d88142 95%, #f09236 100%)` }}>
      <header className="app-header">
        <div className="header-left" onMouseEnter={() => {
          handleAccountHover();
          audioManager.playHover();
        }} onMouseLeave={handleAccountLeave}>
          <button className="account-button" onClick={() => audioManager.playClick()}>
            <span className="account-icon"></span>
            {user ? user.username : 'Account'}
          </button>
          <ErrorBoundary>
            <AccountDropdown 
              isOpen={showAccountDropdown} 
              onClose={() => setShowAccountDropdown(false)}
              onOpenSettings={handleOpenSettings}
              user={user}
              onLogin={onLogin}
              onLogout={onLogout}
            />
          </ErrorBoundary>
        </div>
        {user && (
          <div className="header-right" onMouseEnter={() => {
            handleRecentGamesHover();
            audioManager.playHover();
          }} onMouseLeave={handleRecentGamesLeave}>
            <button className="recent-games-button" onClick={() => audioManager.playClick()}>
              Recent Games
            </button>
            
            <RecentGamesDropdown 
              isOpen={showRecentGamesDropdown} 
              onClose={() => setShowRecentGamesDropdown(false)}
            />
          </div>
        )}
      </header>
      <div className="start-content">
        <h1 className="title">CampusGuessr</h1>
        <p className="subtitle">Explore Canadian Universities</p>
        
        <div className="main-selectors">
          <div className="campus-selector">
              <h3 className="selector-title">Select Campus</h3>
              
              {/* Difficulty Tabs */}
              <div className="difficulty-tabs">
                <button 
                  className={`difficulty-tab ${selectedDifficulty === 'Easy' ? 'active' : ''}`}
                  onClick={() => {
                    audioManager.playClick();
                    setSelectedDifficulty('Easy');
                  }}
                >
                  Easy
                </button>
                <button 
                  className={`difficulty-tab ${selectedDifficulty === 'Medium' ? 'active' : ''}`}
                  onClick={() => {
                    audioManager.playClick();
                    setSelectedDifficulty('Medium');
                  }}
                >
                  Medium
                </button>
                <button 
                  className={`difficulty-tab ${selectedDifficulty === 'Hard' ? 'active' : ''}`}
                  onClick={() => {
                    audioManager.playClick();
                    setSelectedDifficulty('Hard');
                  }}
                >
                  Hard
                </button>
              </div>

              {/* Campus Grid */}
              <div className="campus-grid">
                {campuses
                  .filter(campus => campus.difficulty === selectedDifficulty)
                  .map((campus) => {
                    // Use pre-calculated S-rank thresholds that match the actual campus bounds
                    const sRankThresholds: { [key: string]: number } = {
                      'sfu': 39590,      // Large campus (size ~1837m)
                      'ubc': 42933,      // Very large campus (size ~2273m)
                      'bcit': 31360,     // Medium campus (size ~1175m)
                      'queens': 34192,   // Medium campus (size ~1347m)
                      'uofa': 37246,     // Large campus (size ~1601m)
                      'uc': 30538,       // Medium campus (size ~1123m)
                      'uvic': 36024,     // Medium-large campus (size ~1485m)
                      'dc': 27503,       // Small campus (size ~932m)
                      'lc': 26680,       // Small campus (size ~880m)
                      'vcc': 29326       // Small-medium campus (size ~1046m)
                    };
                    
                    const campusData = campusLocations[campus.id];
                    const campusMaxDistance = calculateCampusSize(campusData.bounds);
                    const sRankThreshold = sRankThresholds[campus.id] || 31360; // Default to BCIT level
                    
                    return { ...campus, sRankThreshold, campusMaxDistance };
                  })
                  .sort((a, b) => b.sRankThreshold - a.sRankThreshold) // Sort by S rank requirement, highest first
                  .map((campus) => {
                    const nameLength = campus.shortName.length;
                    const extraChars = Math.max(0, nameLength - 6);
                    const fontSize = `${2.0 - (extraChars * 0.0625)}rem`;
                    const size = 120 + (extraChars * 4);
                    
                    return (
                      <div
                        key={campus.id}
                        className={`campus-grid-item ${selectedCampus === campus.id ? 'selected' : ''}`}
                        onClick={() => handleCampusSelect(campus, campus.sRankThreshold, campus.campusMaxDistance)}
                      >
                        <div 
                          className="campus-icon-small" 
                          style={{ 
                            backgroundColor: campus.color,
                            fontSize: fontSize,
                            width: `${size}px`,
                            height: `${size}px`
                          }}
                        >
                          {campus.shortName}
                        </div>
                        <div className="campus-name-small">{campus.name}</div>
                        <div className="s-rank-requirement">S Rank: {campus.sRankThreshold.toLocaleString()} pts</div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        
        {showCampusModal && modalCampusData && (
          <CampusDetailModal
            campus={modalCampusData.campus}
            sRankThreshold={modalCampusData.sRankThreshold}
            campusMaxDistance={modalCampusData.campusMaxDistance}
            onClose={handleCloseModal}
            onStart={handleStartFromModal}
          />
        )}
      </div>
    </div>
  );
};

export default StartScreen;