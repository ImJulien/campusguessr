import './Compass.css';

interface CompassProps {
  heading: number;
}

function Compass({ heading }: CompassProps) {
  return (
    <div className="compass-container">
      <div className="compass" style={{ transform: `rotate(${-heading}deg)` }}>
        <div className="compass-arrow">▲</div>
        <div className="compass-label">N</div>
      </div>
    </div>
  );
}

export default Compass;