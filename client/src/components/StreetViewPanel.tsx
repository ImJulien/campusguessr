import React, { useEffect, useRef, useState } from 'react';
import Compass from './Compass.tsx';
import './StreetViewPanel.css';

interface Location {
  lat: number;
  lng: number;
  heading?: number;
  pitch?: number;
}

interface StreetViewPanelProps {
  location: Location;
  gameMode?: 'move' | 'nmpz';
}

const StreetViewPanel = React.memo<StreetViewPanelProps>(function StreetViewPanel({ 
  location, 
  gameMode = 'move' 
}) {
  const streetViewRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const [heading, setHeading] = useState<number>(0);

  useEffect(() => {
    if (!location || !window.google || !streetViewRef.current) return;

    // NMPZ mode restrictions
    const isNMPZ = gameMode === 'nmpz';

    // Initialize Street View panorama
    const panorama = new window.google.maps.StreetViewPanorama(
      streetViewRef.current,
      {
        position: { lat: location.lat, lng: location.lng },
        pov: {
          heading: location.heading || 0,
          pitch: location.pitch || 0,
        },
        zoom: 1,
        addressControl: false,
        showRoadLabels: false,
        motionTracking: false,
        motionTrackingControl: false,
        fullscreenControl: false, // Disable fullscreen on Street View
        // NMPZ restrictions
        linksControl: !isNMPZ, // Disable movement in NMPZ
        panControl: !isNMPZ, // Disable pan in NMPZ
        zoomControl: !isNMPZ, // Disable zoom in NMPZ
        clickToGo: !isNMPZ, // Disable click to move in NMPZ
        scrollwheel: !isNMPZ, // Disable scroll zoom in NMPZ
        disableDoubleClickZoom: isNMPZ, // Disable double click zoom in NMPZ
      }
    );

    panoramaRef.current = panorama;

    // Set initial heading
    setHeading(location.heading || 0);

    // In NMPZ mode, lock the POV to prevent rotation
    let povListener: google.maps.MapsEventListener | null = null;
    if (isNMPZ) {
      // Store the initial POV
      const initialPOV = {
        heading: location.heading || 0,
        pitch: location.pitch || 0
      };

      // Lock the POV - reset it if user tries to change it
      povListener = panorama.addListener('pov_changed', () => {
        const currentPOV = panorama.getPov();
        // If POV changed, reset it back to initial
        if (Math.abs(currentPOV.heading - initialPOV.heading) > 0.1 || 
            Math.abs(currentPOV.pitch - initialPOV.pitch) > 0.1) {
          panorama.setPov(initialPOV);
        }
      });
    } else {
      // In move mode, listen for POV changes to update compass
      povListener = panorama.addListener('pov_changed', () => {
        const pov = panorama.getPov();
        setHeading(pov.heading);
      });
    }

    return () => {
      // Cleanup
      if (povListener) {
        window.google.maps.event.removeListener(povListener);
      }
      if (panoramaRef.current) {
        panoramaRef.current = null;
      }
    };
  }, [location, gameMode]);

  return (
    <div className="streetview-panel">
      <div ref={streetViewRef} className={`streetview ${gameMode === 'nmpz' ? 'nmpz-mode' : ''}`} />
      <Compass heading={heading} />
    </div>
  );
}
);

export default StreetViewPanel;