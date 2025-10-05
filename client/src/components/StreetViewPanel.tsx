import { useEffect, useRef, useState } from 'react';
import Compass from './Compass.tsx';
import './StreetViewPanel.css';

interface StreetViewPanelProps {
  location: { lat: number; lng: number; heading?: number; pitch?: number };
  gameMode: string;
}

function StreetViewPanel({ location, gameMode = 'move' }: StreetViewPanelProps) {
  const streetViewRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const [heading, setHeading] = useState(0);

  useEffect(() => {
    if (!location || !window.google || !streetViewRef.current) return;

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
        fullscreenControl: false,
        linksControl: !isNMPZ,
        panControl: !isNMPZ,
        zoomControl: !isNMPZ,
        clickToGo: !isNMPZ,
        scrollwheel: !isNMPZ,
        disableDoubleClickZoom: isNMPZ,
      }
    );

    panoramaRef.current = panorama;
    setHeading(location.heading || 0);

    // NMPZ mode - lock POV
    let povListener: google.maps.MapsEventListener | null = null;
    if (isNMPZ) {
      const initialPOV = {
        heading: location.heading || 0,
        pitch: location.pitch || 0,
        zoom: 0
      };

      povListener = panorama.addListener('pov_changed', () => {
        const currentPOV = panorama.getPov();
        if (Math.abs(currentPOV.heading - initialPOV.heading) > 0.1 || 
            Math.abs(currentPOV.pitch - initialPOV.pitch) > 0.1 ||
            currentPOV.zoom !== initialPOV.zoom) {
          panorama.setPov(initialPOV);
        }
      });
    } else {
      // Move mode - update compass
      povListener = panorama.addListener('pov_changed', () => {
        const pov = panorama.getPov();
        setHeading(pov.heading);
      });
    }

    return () => {
      if (povListener) {
        google.maps.event.removeListener(povListener);
      }
      panoramaRef.current = null;
    };
  }, [location, gameMode]);

  return (
    <div className="streetview-panel">
      <div ref={streetViewRef} className={`streetview ${gameMode === 'nmpz' ? 'nmpz-mode' : ''}`} />
      <Compass heading={heading} />
    </div>
  );
}

export default StreetViewPanel;