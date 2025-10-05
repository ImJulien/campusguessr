import React from 'react';
import './Compass.css';

interface CompassProps {
  heading: number;
}

const Compass = React.memo<CompassProps>(function Compass({ heading }) {
    // Normalize heading to 0-360
    const normalizedHeading = ((heading % 360) + 360) % 360;

    // Get cardinal direction
    const getCardinalDirection = (deg: number): string => {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round(deg / 45) % 8;
        return directions[index];
    };

    const cardinalDirection = getCardinalDirection(normalizedHeading);

    return (
        <div className="compass-container">
            <div className="compass-outer">
                <div className="compass-inner" style={{ transform: `rotate(${-normalizedHeading}deg)` }}>
                    <div className="compass-north">N</div>
                    <div className="compass-east">E</div>
                    <div className="compass-south">S</div>
                    <div className="compass-west">W</div>
                    <div className="compass-arrow"></div>
                </div>
            </div>
            <div className="compass-heading">
                <div className="compass-direction">{cardinalDirection}</div>
                <div className="compass-degrees">{Math.round(normalizedHeading)}°</div>
            </div>
        </div>
    );
}
);

export default Compass;