// Campus locations with boundary boxes for random coordinate generation
// TODO: Replace with backend API call to get random locations

interface Location {
  lat: number;
  lng: number;
}

interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface Campus {
  name: string;
  shortName: string;
  center: Location;
  bounds: Bounds;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface RandomLocation extends Location {
  heading: number;
  pitch: number;
}

interface CampusLocations {
  [key: string]: Campus;
}

export const campusLocations: CampusLocations = {
  sfu: {
    name: 'Simon Fraser University',
    shortName: 'SFU',
    center: { lat: 49.2781, lng: -122.9199 },
    bounds: {
      north: 49.2820,
      south: 49.2750,
      east: -122.9150,
      west: -122.9250
    },
    difficulty: 'Medium'
  },
  ubc: {
    name: 'University of British Columbia',
    shortName: 'UBC',
    center: { lat: 49.2606, lng: -123.2460 },
    bounds: {
      north: 49.2700,
      south: 49.2550,
      east: -123.2400,
      west: -123.2600
    },
    difficulty: 'Hard'
  },
  uvic: {
    name: 'University of Victoria',
    shortName: 'UVic',
    center: { lat: 48.4634, lng: -123.3117 },
    bounds: {
      north: 48.4680,
      south: 48.4600,
      east: -123.3050,
      west: -123.3180
    },
    difficulty: 'Hard'
  },
  bcit: {
    name: 'British Columbia Institute of Technology',
    shortName: 'BCIT',
    center: { lat: 49.2502, lng: -123.0012 },
    bounds: {
      north: 49.2530,
      south: 49.2480,
      east: -122.9980,
      west: -123.0050
    },
    difficulty: 'Easy'
  },
  langara: {
    name: 'Langara College',
    shortName: 'Langara',
    center: { lat: 49.2259, lng: -123.1088 },
    bounds: {
      north: 49.2280,
      south: 49.2240,
      east: -123.1060,
      west: -123.1120
    },
    difficulty: 'Easy'
  },
  douglas: {
    name: 'Douglas College',
    shortName: 'Douglas',
    center: { lat: 49.2288, lng: -122.8889 },
    bounds: {
      north: 49.2310,
      south: 49.2270,
      east: -122.8860,
      west: -122.8920
    },
    difficulty: 'Easy'
  },
  vcc: {
    name: 'Vancouver Community College',
    shortName: 'VCC',
    center: { lat: 49.2626, lng: -123.0714 },
    bounds: {
      north: 49.2650,
      south: 49.2600,
      east: -123.0680,
      west: -123.0750
    },
    difficulty: 'Hard'
  },
  queens: {
    name: "Queen's University",
    shortName: "Queen's",
    center: { lat: 44.2253, lng: -76.4951 },
    bounds: {
      north: 44.2300,
      south: 44.2200,
      east: -76.4900,
      west: -76.5000
    },
    difficulty: 'Medium'
  },
  uofa: {
    name: 'University of Alberta',
    shortName: 'UofA',
    center: { lat: 53.5232, lng: -113.5263 },
    bounds: {
      north: 53.5280,
      south: 53.5190,
      east: -113.5200,
      west: -113.5320
    },
    difficulty: 'Medium'
  },
  ucalgary: {
    name: 'University of Calgary',
    shortName: 'UofC',
    center: { lat: 51.0775, lng: -114.1335 },
    bounds: {
      north: 51.0820,
      south: 51.0730,
      east: -114.1280,
      west: -114.1390
    },
    difficulty: 'Medium'
  },
  uoft: {
    name: 'University of Toronto',
    shortName: 'UofT',
    center: { lat: 43.6629, lng: -79.3957 },
    bounds: {
      north: 43.6680,
      south: 43.6580,
      east: -79.3900,
      west: -79.4020
    },
    difficulty: 'Hard'
  },
  waterloo: {
    name: 'University of Waterloo',
    shortName: 'UofW',
    center: { lat: 43.4723, lng: -80.5449 },
    bounds: {
      north: 43.4770,
      south: 43.4680,
      east: -80.5380,
      west: -80.5520
    },
    difficulty: 'Hard'
  },
  mcgill: {
    name: 'McGill University',
    shortName: 'McGill',
    center: { lat: 45.5048, lng: -73.5772 },
    bounds: {
      north: 45.5080,
      south: 45.5020,
      east: -73.5720,
      west: -73.5820
    },
    difficulty: 'Easy'
  },
  mcmaster: {
    name: 'McMaster University',
    shortName: 'Mac',
    center: { lat: 43.2609, lng: -79.9192 },
    bounds: {
      north: 43.2650,
      south: 43.2570,
      east: -79.9140,
      west: -79.9240
    },
    difficulty: 'Easy'
  },
  udem: {
    name: 'Université de Montréal',
    shortName: 'UdeM',
    center: { lat: 45.5048, lng: -73.6132 },
    bounds: {
      north: 45.5090,
      south: 45.5010,
      east: -73.6080,
      west: -73.6180
    },
    difficulty: 'Medium'
  },
  guelph: {
    name: 'University of Guelph',
    shortName: 'Guelph',
    center: { lat: 43.5320, lng: -80.2262 },
    bounds: {
      north: 43.5370,
      south: 43.5280,
      east: -80.2200,
      west: -80.2320
    },
    difficulty: 'Easy'
  }
};

/**
 * Generate a random location within the campus bounds
 * @param campusKey - The key for the campus (e.g., 'sfu', 'ubc', 'uvic')
 * @returns Random location object with lat, lng, heading, and pitch
 */
export const generateRandomLocation = (campusKey: string): RandomLocation | null => {
  const campus = campusLocations[campusKey];
  if (!campus || !campus.bounds) {
    console.error(`Invalid campus: ${campusKey}`);
    return null;
  }

  const { north, south, east, west } = campus.bounds;
  
  // Generate random latitude and longitude within bounds
  const lat = south + Math.random() * (north - south);
  const lng = west + Math.random() * (east - west);
  
  // Random heading (0-360 degrees)
  const heading = Math.random() * 360;
  
  // Random pitch (-90 to 90, but typically 0-10 for street view)
  const pitch = Math.random() * 10;
  
  return {
    lat,
    lng,
    heading,
    pitch
  };
};

// Export types for use in other components
export type { Location, Bounds, Campus, RandomLocation, CampusLocations };