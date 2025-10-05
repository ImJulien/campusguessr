import React, { useState } from 'react';
import AudioManager from '../utils/audioManager';
import './CampusDetailModal.css';

interface Campus {
  id: string;
  name: string;
  shortName: string;
  color: string;
  difficulty: string;
}

interface CampusDetailModalProps {
  campus: Campus;
  sRankThreshold: number;
  campusMaxDistance: number;
  onClose: () => void;
  onStart: (campusId: string, gameMode: string) => void;
}

const CampusDetailModal: React.FC<CampusDetailModalProps> = ({ 
  campus, 
  sRankThreshold, 
  campusMaxDistance, 
  onClose, 
  onStart 
}) => {
  const [gameMode, setGameMode] = useState<'move' | 'nmpz'>('move');
  const audioManager = AudioManager.getInstance();

  const handleStartGame = (): void => {
    audioManager.playClick();
    onStart(campus.id, gameMode);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation();
  };

  // Calculate font size same as in the grid
  const nameLength = campus.shortName.length;
  const extraChars = Math.max(0, nameLength - 6);
  const fontSize = `${2.0 - (extraChars * 0.0625)}rem`;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="campus-detail-modal" onClick={handleModalClick}>
        <button className="modal-close-button" onClick={() => {
          audioManager.playClick();
          onClose();
        }}>✕</button>
        
        <div className="modal-header">
          <div 
            className="modal-campus-icon" 
            style={{ backgroundColor: campus.color, fontSize: fontSize }}
          >
            {campus.shortName}
          </div>
          <h2 className="modal-campus-name">{campus.name}</h2>
        </div>

        <div className="modal-content">
          <div className="campus-stats">
            <div className="stat-item">
              <div className="stat-label">Campus Size</div>
              <div className="stat-value">{Math.round(campusMaxDistance)} m</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">S Rank Required</div>
              <div className="stat-value">{sRankThreshold.toLocaleString()} pts</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Difficulty</div>
              <div className={`stat-value difficulty-${campus.difficulty.toLowerCase()}`}>
                {campus.difficulty}
              </div>
            </div>
          </div>

          <div className="mode-selector-modal">
            <h3 className="modal-section-title">Select Game Mode</h3>
            <div className="modal-mode-options">
              <button 
                className={`modal-mode-button ${gameMode === 'move' ? 'active' : ''}`}
                onClick={() => {
                  audioManager.playClick();
                  setGameMode('move');
                }}
              >
                <div className="modal-mode-name">Move</div>
                <div className="modal-mode-description">Full movement and zoom</div>
              </button>
              <button 
                className={`modal-mode-button ${gameMode === 'nmpz' ? 'active' : ''}`}
                onClick={() => {
                  audioManager.playClick();
                  setGameMode('nmpz');
                }}
              >
                <div className="modal-mode-name">Bullet</div>
                <div className="modal-mode-description">No Move, Pan, or Zoom</div>
              </button>
            </div>
          </div>

          <button className="modal-start-button" onClick={handleStartGame}>
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampusDetailModal;