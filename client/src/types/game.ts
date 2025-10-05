export interface Location {
  lat: number;
  lng: number;
  heading?: number;
  pitch?: number;
}

export interface RoundScore {
  round: number;
  score: number;
  distance: number;
  actualLocation?: { lat: number; lng: number };
  guessLocation?: { lat: number; lng: number } | null; // Allow null
}