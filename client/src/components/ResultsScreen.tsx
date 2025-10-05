import React, { useEffect } from 'react';
import './ResultsScreen.css';
import { campusLocations } from '../data/locations';
import { calculateCampusSize } from '../utils/scoring';
import AudioManager from '../utils/audioManager';

interface RoundScore {
  round: number;
  score: number;
  distance: number;
  actualLocation?: { lat: number; lng: number };
  guessLocation?: { lat: number; lng: number };
}

interface ResultsScreenProps {
  totalScore: number;
  roundScores: RoundScore[];
  onPlayAgain: () => void;
  onBackToMenu: () => void;
  selectedCampus: string;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ 
  totalScore, 
  roundScores, 
  onPlayAgain, 
  onBackToMenu, 
  selectedCampus 
}) => {
    const audioManager = AudioManager.getInstance();
    const maxPossibleScore = roundScores.length * 10000;
    
    // Play shine sound effect when results screen loads
    useEffect(() => {
        audioManager.playShine();
    }, []);
    
    const getGrade = (): { grade: string; message: string } => {
        // Calculate campus-specific S rank threshold
        const campusData = campusLocations[selectedCampus];
        const campusMaxDistance = calculateCampusSize(campusData.bounds);
        const minThreshold = 25000;
        const maxThreshold = 43000;
        const minCampusSize = 600;
        const maxCampusSize = 2300;
        const normalizedSize = (campusMaxDistance - minCampusSize) / (maxCampusSize - minCampusSize);
        const sRankThreshold = Math.round(minThreshold + (normalizedSize * (maxThreshold - minThreshold)));
        
        // All grade thresholds scale based on the S rank requirement
        // S = 100% of S rank threshold
        // A = 86% of S rank threshold  
        // B = 70% of S rank threshold
        // C = 51% of S rank threshold
        // D = 35% of S rank threshold
        const aRankThreshold = Math.round(sRankThreshold * 0.86);
        const bRankThreshold = Math.round(sRankThreshold * 0.70);
        const cRankThreshold = Math.round(sRankThreshold * 0.51);
        const dRankThreshold = Math.round(sRankThreshold * 0.35);
        
        if (totalScore >= sRankThreshold) return { grade: 'S', message: 'Outstanding!' };
        if (totalScore >= aRankThreshold) return { grade: 'A', message: 'Excellent!' };
        if (totalScore >= bRankThreshold) return { grade: 'B', message: 'Great Job!' };
        if (totalScore >= cRankThreshold) return { grade: 'C', message: 'Good Effort!' };
        if (totalScore >= dRankThreshold) return { grade: 'D', message: 'Keep Practicing!' };
        return { grade: 'F', message: 'Try Again!' };
    };

    const { grade, message } = getGrade();

    const formatDistance = (dist: number): string => {
        if (dist < 1000) {
            return `${Math.round(dist)} m`;
        }
        return `${(dist / 1000).toFixed(2)} km`;
    };

    return (
        <div className="results-screen">
            <div className="results-content">
                <h1 className="results-title">Game Complete!</h1>

                <div className="final-score-container">
                    <div className={`grade-badge grade-${grade.toLowerCase()}`}>{grade}</div>
                    <div className="score-details">
                        <div className="score-line">
                            <div className="total-score">{totalScore}</div>
                            <div className="score-max">/ {maxPossibleScore}</div>
                        </div>
                        <div className="grade-message">{message}</div>
                    </div>
                </div>

                <div className="rounds-summary">
                    <h2>Round Summary</h2>
                    <div className="rounds-list">
                        {roundScores.map((round, index) => (
                            <div key={index} className="round-item">
                                <div className="round-number">Round {round.round}</div>
                                <div className="round-stats">
                                    <span className="round-distance">{formatDistance(round.distance)}</span>
                                    <span className="round-score">{round.score} pts</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="results-buttons">
                    <button className="back-to-menu-button" onClick={() => {
                        audioManager.playClick();
                        onBackToMenu();
                    }}>
                        Back to Menu
                    </button>
                    <button className="play-again-button" onClick={() => {
                        audioManager.playClick();
                        onPlayAgain();
                    }}>
                        Play Again
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResultsScreen;