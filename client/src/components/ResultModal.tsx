import React from 'react';
import './ResultModal.css';

interface Location {
  lat: number;
  lng: number;
}

interface ResultModalProps {
  distance: number;
  score: number;
  onNext: () => void;
  isLastRound: boolean;
  guessLocation: Location | null;
  actualLocation: Location;
  selectedCampus: string;
}

const ResultModal: React.FC<ResultModalProps> = ({ 
  distance, 
  score, 
  onNext, 
  isLastRound, 
  guessLocation, 
  actualLocation}) => {
    console.log('ResultModal rendered with:', { guessLocation, actualLocation });

    // Create static map URL with markers and path
    const getStaticMapUrl = (): string | null => {
        if (!guessLocation || !actualLocation) return null;

        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; // Changed from REACT_APP_GOOGLE_MAPS_API_KEY
        const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';

        // Custom marker for user's guess - we'll use a circle icon (placeholder for profile pic)
        // Using a small custom icon URL - for now just use default marker but we can replace with profile pic later
        const guessMarker = `color:0x4285F4|${guessLocation.lat},${guessLocation.lng}`;

        // Red marker for actual location
        const actualMarker = `color:red|${actualLocation.lat},${actualLocation.lng}`;

        // Yellow path between them
        const path = `color:0xFFD700|weight:4|${guessLocation.lat},${guessLocation.lng}|${actualLocation.lat},${actualLocation.lng}`;

        const url = `${baseUrl}?size=700x400&markers=${encodeURIComponent(guessMarker)}&markers=${encodeURIComponent(actualMarker)}&path=${encodeURIComponent(path)}&key=${apiKey}`;

        console.log('Static map URL:', url);
        return url;
    };

    const getPerformanceMessage = (): string => {
        if (distance < 50) return 'Perfect! You nailed it!';
        if (distance < 100) return 'Excellent! Very close!';
        if (distance < 200) return 'Great job!';
        if (distance < 500) return 'Not bad!';
        return 'Keep trying!';
    };

    const formatDistance = (dist: number): string => {
        // Check if no guess was made (distance set to 999999)
        if (dist >= 999999) {
            return 'No guess made';
        }
        if (dist < 1000) {
            return `${Math.round(dist)} m`;
        }
        return `${(dist / 1000).toFixed(2)} km`;
    };

    const getAccuracyLevel = (): string => {
        if (distance < 50) return 'Perfect';
        if (distance < 100) return 'Excellent';
        if (distance < 200) return 'Great';
        if (distance < 500) return 'Good';
        if (distance < 1000) return 'Fair';
        return 'Try Again';
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>): void => {
        console.error('Failed to load static map');
        e.currentTarget.style.display = 'none';
    };

    return (
        <div className="result-modal-overlay">
            <div className="result-modal">
                <h2 className="result-title">{getPerformanceMessage()}</h2>

                <div className="accuracy-level">{getAccuracyLevel()}</div>

                <div className="result-stats">
                    <div className="stat-item">
                        <div className="stat-label">Distance</div>
                        <div className="stat-value">{formatDistance(distance)}</div>
                        <div className="stat-sublabel">from actual location</div>
                    </div>

                    <div className="stat-item">
                        <div className="stat-label">Points Earned</div>
                        <div className="stat-value score-highlight">{score}</div>
                        <div className="stat-sublabel">out of 10000</div>
                    </div>
                </div>

                {/* Map showing guess vs actual location */}
                {guessLocation && actualLocation ? (
                    <div className="result-map-container">
                        <img
                            src={getStaticMapUrl() || ''}
                            alt="Result map showing your guess and actual location"
                            style={{ width: '100%', height: '400px', objectFit: 'cover', borderRadius: '15px' }}
                            onError={handleImageError}
                        />
                    </div>
                ) : (
                    <div className="result-map-container">
                        <p style={{ color: 'white', padding: '20px' }}>No location data available</p>
                    </div>
                )}

                <button className="next-button" onClick={onNext}>
                    {isLastRound ? 'See Final Results' : 'Next Round'}
                </button>
            </div>
        </div>
    );
};

export default ResultModal;