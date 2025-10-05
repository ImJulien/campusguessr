import express, { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';
import axios from 'axios';

const prisma = new PrismaClient();
const router = express.Router();

// Campus bounds (from the local version's locations.js)
const campusBounds: Record<string, {
  north: number;
  south: number;
  east: number;
  west: number;
  name: string;
}> = {
  ubc: {
    name: "University of British Columbia",
    north: 49.2756,
    south: 49.2584,
    east: -123.2360,
    west: -123.2656
  },
  sfu: {
    name: "Simon Fraser University", 
    north: 49.2820,
    south: 49.2740,
    east: -122.9080,
    west: -122.9280
  },
  // Add more campuses...
};

// Generate random location within campus bounds
function generateRandomLocation(campus: string) {
  const bounds = campusBounds[campus];
  if (!bounds) return null;

  const lat = bounds.south + Math.random() * (bounds.north - bounds.south);
  const lng = bounds.west + Math.random() * (bounds.east - bounds.west);
  
  return { lat, lng };
}

// Check if Street View exists at location using Google Maps API
async function hasStreetView(lat: number, lng: number): Promise<boolean> {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&radius=100&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );
    
    return response.data.status === 'OK';
  } catch (error) {
    return false;
  }
}

// Generate valid location with Street View coverage
async function generateValidLocation(campus: string, maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i++) {
    const location = generateRandomLocation(campus);
    if (!location) continue;

    const hasView = await hasStreetView(location.lat, location.lng);
    if (hasView) {
      return location;
    }
  }
  
  // Fallback to campus center if no valid location found
  const bounds = campusBounds[campus];
  return {
    lat: (bounds.north + bounds.south) / 2,
    lng: (bounds.east + bounds.west) / 2
  };
}

// Start a new game
router.post('/start', async (req: Request, res: Response) => {
  const { userId, campus = 'ubc', rounds = 5 } = req.body;

  try {
    // Create new game
    const game = await prisma.game.create({
      data: { playerId: userId }
    });

    // Generate first random location with Street View
    const location = await generateValidLocation(campus);

    // Store location in session/game (don't send coordinates to client!)
    // For now, we'll store in a temporary map (use Redis in production)
    gameLocations.set(game.id, {
      currentRound: 1,
      totalRounds: rounds,
      campus,
      currentLocation: location,
      allLocations: [location]
    });

    res.json({ 
      gameId: game.id,
      currentRound: 1,
      totalRounds: rounds,
      campus,
      // DON'T send coordinates - client will load Street View separately
    });
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ error: 'Failed to start game' });
  }
});

// Temporary in-memory storage (use Redis in production)
const gameLocations = new Map<string, {
  currentRound: number;
  totalRounds: number;
  campus: string;
  currentLocation: { lat: number; lng: number };
  allLocations: Array<{ lat: number; lng: number }>;
}>();

// Get Street View location for current round (without revealing coordinates)
router.get('/:gameId/streetview', async (req: Request, res: Response) => {
  const { gameId } = req.params;

  const gameData = gameLocations.get(gameId);
  if (!gameData) {
    return res.status(404).json({ error: 'Game not found' });
  }

  // Return Street View URL without coordinates
  const { lat, lng } = gameData.currentLocation;
  
  res.json({
    // Client will use this to load Street View
    streetViewUrl: `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${lat},${lng}&key=${process.env.GOOGLE_MAPS_API_KEY}`,
    // Or return lat/lng for client-side Street View component
    location: { lat, lng }
  });
});

// Submit a guess
router.post('/guess', async (req: Request, res: Response) => {
  const { gameId, guessLat, guessLng, userId, timeTaken } = req.body;

  try {
    const gameData = gameLocations.get(gameId);
    if (!gameData) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const { currentLocation } = gameData;

    // Calculate distance
    const distance = calculateDistance(
      guessLat,
      guessLng,
      currentLocation.lat,
      currentLocation.lng
    );

    // Calculate points
    const points = calculateScore(distance, timeTaken);

    // Save score - SIMPLE VERSION
    await prisma.score.create({
      data: {
        gameId,
        playerId: userId,
        actualLat: currentLocation.lat,
        actualLng: currentLocation.lng,
        guessLat,
        guessLng,
        distance,
        points,
        time: timeTaken,
      },
    });

    res.json({
      distance,
      points,
      actualLocation: {
        lat: currentLocation.lat,
        lng: currentLocation.lng
      },
      guessLocation: {
        lat: guessLat,
        lng: guessLng
      }
    });
  } catch (error) {
    console.error('Error submitting guess:', error);
    res.status(500).json({ error: 'Failed to submit guess' });
  }
});

// Next round - generate new location
router.post('/:gameId/next-round', async (req: Request, res: Response) => {
  const { gameId } = req.params;

  try {
    const gameData = gameLocations.get(gameId);
    if (!gameData) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Check if game is complete
    if (gameData.currentRound >= gameData.totalRounds) {
      return res.status(400).json({ error: 'Game already complete' });
    }

    // Generate new random location
    const newLocation = await generateValidLocation(gameData.campus);

    // Update game data
    gameData.currentRound++;
    gameData.currentLocation = newLocation;
    gameData.allLocations.push(newLocation);

    res.json({
      currentRound: gameData.currentRound,
      totalRounds: gameData.totalRounds
    });
  } catch (error) {
    console.error('Error getting next round:', error);
    res.status(500).json({ error: 'Failed to get next round' });
  }
});

// Complete game
router.post('/:gameId/complete', async (req: Request, res: Response) => {
  const { gameId } = req.params;
  const { userId } = req.body;

  try {
    const scores = await prisma.score.findMany({
      where: { gameId }
    });

    const totalPoints = scores.reduce((sum, score) => sum + score.points, 0);
    const totalDistance = scores.reduce((sum, score) => sum + score.distance, 0);

    await prisma.game.update({
      where: { id: gameId },
      data: { completedAt: new Date() }
    });

    await prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: totalPoints } }
    });

    // Clean up game data
    gameLocations.delete(gameId);

    res.json({
      totalPoints,
      totalDistance,
      averageDistance: totalDistance / scores.length,
      roundsPlayed: scores.length,
      scores
    });
  } catch (error) {
    console.error('Error completing game:', error);
    res.status(500).json({ error: 'Failed to complete game' });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const topPlayers = await prisma.user.findMany({
      orderBy: { xp: 'desc' },
      take: 10,
      select: {
        publicId: true,
        username: true,
        xp: true,
        level: true,
        school: {
          select: {
            name: true,
            acronym: true,
            badge: true
          }
        }
      }
    });

    res.json(topPlayers);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Helper functions
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function calculateScore(distance: number, timeTaken: number): number {
  let baseScore = 0;
  
  if (distance < 25) baseScore = 1000;
  else if (distance < 50) baseScore = 950;
  else if (distance < 100) baseScore = 850;
  else if (distance < 250) baseScore = 650;
  else if (distance < 500) baseScore = 400;
  else if (distance < 1000) baseScore = 200;
  else if (distance < 2000) baseScore = 50;
  else baseScore = 10;

  const timeBonus = Math.max(0, (60 - timeTaken) / 60 * 0.2);
  
  return Math.round(baseScore * (1 + timeBonus));
}

export default router;