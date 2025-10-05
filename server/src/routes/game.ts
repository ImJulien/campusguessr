import express, { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';
import axios from 'axios';

const prisma = new PrismaClient();
const router = express.Router();

console.log('Google Maps API Key loaded:', process.env.GOOGLE_MAPS_API_KEY ? 'YES' : 'NO');

// Campus bounds
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
};

function generateRandomLocation(campus: string) {
  const bounds = campusBounds[campus];
  if (!bounds) return null;

  const lat = bounds.south + Math.random() * (bounds.north - bounds.south);
  const lng = bounds.west + Math.random() * (bounds.east - bounds.west);
  
  return { lat, lng };
}

async function hasStreetView(lat: number, lng: number): Promise<boolean> {
  try {
    const url = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&radius=100&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    
    console.log('Checking Street View URL:', url);
    
    const response = await axios.get(url);
    
    console.log('Street View API Response:', response.data);
    
    return response.data.status === 'OK';
  } catch (error) {
    console.error('Street View API Error:', error); 
    return false;
  }
}

async function generateValidLocation(campus: string, maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i++) {
    const location = generateRandomLocation(campus);
    if (!location) continue;

    console.log(`Attempt ${i + 1}: Checking ${location.lat}, ${location.lng}`);

    const hasView = await hasStreetView(location.lat, location.lng);
    console.log(`Has Street View: ${hasView}`);
    
    if (hasView) {
      console.log('✅ Valid location found!');
      return location;
    }
  }
  
  console.log('⚠️ No valid location found, using fallback');
  const bounds = campusBounds[campus];
  
  // Add null check
  if (!bounds) {
    console.error(`❌ Campus '${campus}' not found in campusBounds`);
    // Default to SFU
    return {
      lat: 49.2781,
      lng: -122.9199
    };
  }
  
  return {
    lat: (bounds.north + bounds.south) / 2,
    lng: (bounds.east + bounds.west) / 2
  };
}

// Temporary in-memory storage
const gameLocations = new Map<string, {
  currentRound: number;
  totalRounds: number;
  campus: string;
  currentLocation: { lat: number; lng: number };
  allLocations: Array<{ lat: number; lng: number }>;
}>();

// Start a new game
router.post('/start', async (req: Request, res: Response) => {
  const { userId, campus = 'ubc', rounds = 5 } = req.body;
  
  console.log('Starting game with campus:', campus);

  try {
    const game = await prisma.game.create({
      data: { playerId: userId }
    });

    const location = await generateValidLocation(campus);

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
    });
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ error: 'Failed to start game' });
  }
});

// Get Street View location
router.get('/:gameId/streetview', async (req: Request, res: Response) => {
  const { gameId } = req.params;

  const gameData = gameLocations.get(gameId);
  if (!gameData) {
    return res.status(404).json({ error: 'Game not found' });
  }

  const { lat, lng } = gameData.currentLocation;
  
  res.json({
    location: { lat, lng }
  });
});

// Submit a guess
router.post('/guess', async (req: Request, res: Response) => {
  const { gameId, guessLat, guessLng, timeTaken } = req.body;

  try {
    const gameData = gameLocations.get(gameId);
    if (!gameData) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const { currentLocation, currentRound } = gameData;

    // Calculate distance
    const distance = calculateDistance(
      guessLat,
      guessLng,
      currentLocation.lat,
      currentLocation.lng
    );

    // Calculate points
    const points = calculateScore(distance, timeTaken);

    // Save score - ONLY fields that exist in your schema
    await prisma.score.create({
      data: {
        gameId,
        distance,
        points,
        timeLeft: Math.max(0, 60 - timeTaken),
        roundNumber: currentRound,
        actualLocation: [currentLocation.lat, currentLocation.lng],
        guessedLocation: [guessLat, guessLng],
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

// Next round
router.post('/:gameId/next-round', async (req: Request, res: Response) => {
  const { gameId } = req.params;

  try {
    const gameData = gameLocations.get(gameId);
    if (!gameData) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (gameData.currentRound >= gameData.totalRounds) {
      return res.status(400).json({ error: 'Game already complete' });
    }

    const newLocation = await generateValidLocation(gameData.campus);
    
    console.log('New location generated:', newLocation);

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

    // Update game - only completedAt (remove xpEarned)
    await prisma.game.update({
      where: { id: gameId },
      data: { 
        completedAt: new Date()
      }
    });

    // Update user XP
    await prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: totalPoints } }
    });

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