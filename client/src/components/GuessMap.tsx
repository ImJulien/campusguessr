import { useEffect, useRef } from 'react';
import './GuessMap.css';

interface GuessMapProps {
  onMapClick: (lat: number, lng: number) => void;
  guessLocation: { lat: number; lng: number } | null;
  actualLocation?: { lat: number; lng: number } | null;
  hasGuessed: boolean;
  selectedCampus: string;
}

const campusCenters: Record<string, { lat: number; lng: number }> = {
  ubc: { lat: 49.2606, lng: -123.2460 },
  sfu: { lat: 49.2781, lng: -122.9199 },
  uvic: { lat: 48.4634, lng: -123.3117 },
};

function GuessMap({ onMapClick, guessLocation, hasGuessed, selectedCampus }: GuessMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    const campusCenter = campusCenters[selectedCampus] || campusCenters.sfu;

    const map = new google.maps.Map(mapRef.current, {
      center: campusCenter,
      zoom: 15,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    googleMapRef.current = map;

    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (!hasGuessed && e.latLng) {
        onMapClick(e.latLng.lat(), e.latLng.lng());
      }
    });

  }, [selectedCampus]);

  // Update marker when guess location changes
  useEffect(() => {
    if (!googleMapRef.current || !window.google) return;

    // Remove old marker
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    // Add new marker
    if (guessLocation && !hasGuessed) {
      markerRef.current = new google.maps.Marker({
        position: guessLocation,
        map: googleMapRef.current,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        },
        label: {
          text: 'Your Guess',
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
          className: 'marker-label'
        }
      });
    }
  }, [guessLocation, hasGuessed]);

  return <div ref={mapRef} className="guess-map" />;
}

export default GuessMap;