import React, { useCallback } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { campusLocations } from '../data/locations';
import './GuessMap.css';

interface Location {
  lat: number;
  lng: number;
}

interface GuessMapProps {
  onMapClick: (location: Location) => void;
  guessLocation: Location | null;
  hasGuessed: boolean;
  selectedCampus?: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  clickableIcons: false, // Prevents clicking on POI markers
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{ visibility: 'on' }]
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.stroke',
      stylers: [{ visibility: 'on' }]
    },
    {
      featureType: 'poi',
      elementType: 'labels.icon',
      stylers: [{ visibility: 'on' }]
    }
  ]
};

const GuessMap = React.memo<GuessMapProps>(function GuessMap({ 
  onMapClick, 
  guessLocation, 
  hasGuessed, 
  selectedCampus = 'sfu' 
}) {
  const campusCenter = campusLocations[selectedCampus]?.center || { lat: 49.2781, lng: -122.9199 };

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!hasGuessed && e.latLng) {
      onMapClick({
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      });
    }
  }, [onMapClick, hasGuessed]);

  return (
    <div className="guess-map">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={campusCenter}
        zoom={15}
        onClick={handleMapClick}
        options={mapOptions}
      >
        {/* Guess marker - only show before submitting */}
        {guessLocation && !hasGuessed && (
          <Marker
            position={guessLocation}
            icon={{
              url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              scaledSize: new window.google.maps.Size(40, 40),
              anchor: new window.google.maps.Point(20, 20) // Center the marker on click point
            }}
            label={{
              text: 'Your Guess',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
              className: 'marker-label'
            }}
          />
        )}

        {/* Don't show actual location marker or polyline - those are only in the result modal */}
      </GoogleMap>
    </div>
  );
}
);

export default GuessMap;