interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in meters
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Distance in meters
  return distance;
}

/**
 * Calculate the maximum possible distance within a campus (diagonal of bounds)
 * @param bounds - Campus boundary coordinates
 * @returns Maximum distance in meters
 */
export function calculateCampusSize(bounds: Bounds): number {
  // Calculate diagonal distance from southwest to northeast corner
  const maxDistance = calculateDistance(
    bounds.south,
    bounds.west,
    bounds.north,
    bounds.east
  );
  return maxDistance;
}

/**
 * Calculate score based on distance and campus size
 * Max score: 10000 points per round (50000 total for 5 rounds)
 * Score decreases based on accuracy relative to campus size
 * @param distanceInMeters - Distance from actual location in meters
 * @param campusMaxDistance - Maximum possible distance within campus
 * @returns Score between 0 and 10000
 */
export function calculateScore(distanceInMeters: number, campusMaxDistance: number): number {
  const maxScore = 10000;
  const perfectDistance = 25; // Within 25m = max score
  
  // Perfect guess (within 25m) = 10000 points
  if (distanceInMeters <= perfectDistance) return maxScore;
  
  // At or beyond campus diagonal = 0 points
  if (distanceInMeters >= campusMaxDistance) return 0;

  // Score decreases from 10000 to 0 between 25m and campus max distance
  // Uses exponential decay for smoother scoring curve (power of 2.0 for more forgiving curve)
  const adjustedDistance = distanceInMeters - perfectDistance;
  const adjustedMaxDistance = campusMaxDistance - perfectDistance;
  const normalizedDistance = adjustedDistance / adjustedMaxDistance;
  
  const score = Math.round(maxScore * Math.pow(1 - normalizedDistance, 2.0));

  return Math.max(0, Math.min(maxScore, score));
}

// Export types for use in other components
export type { Bounds };