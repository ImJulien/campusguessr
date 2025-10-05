import express, { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';
import jwt from 'jsonwebtoken';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const prisma = new PrismaClient();
const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req: Request, res: Response, next: Function) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET!, (err: any, user: any) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Get user profile with stats
router.get('/user/profile', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                school: true,
                games: {
                    include: {
                        scores: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Calculate user stats
        const totalGames = user.games.length;
        const completedGames = user.games.filter(game => game.completedAt).length;
        const totalGuesses = user.games.reduce((sum, game) => sum + game.scores.length, 0);
        
        let totalPoints = 0;
        user.games.forEach(game => {
            game.scores.forEach(score => {
                totalPoints += score.points;
            });
        });
        
        const averageScore = totalGuesses > 0 ? Math.round(totalPoints / totalGuesses) : 0;

        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            school: user.school,
            xp: user.xp,
            level: user.level,
            emailVerified: user.emailVerified,
            studentVerified: user.studentVerified,
            stats: {
                averageScore,
                lifetimeGuesses: totalGuesses,
                completedGames,
                totalGames,
                totalPoints
            }
        });
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start a new game
router.post('/game/start', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { campus } = req.body;
        
        const game = await prisma.game.create({
            data: {
                playerId: userId,
                campus: campus || null
            }
        });

        res.json({ gameId: game.id });
    } catch (error) {
        console.error('Start game error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Save game score for a round
router.post('/game/:gameId/score', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { gameId } = req.params;
        const { round, points, distance, timeLeft, actualLocation, guessedLocation } = req.body;

        // Verify game belongs to user
        const game = await prisma.game.findFirst({
            where: {
                id: gameId,
                playerId: userId
            }
        });

        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        const score = await prisma.score.create({
            data: {
                gameId,
                distance: parseFloat(distance),
                points: parseInt(points),
                timeLeft: parseInt(timeLeft || 0),
                roundNumber: parseInt(round),
                actualLocation: actualLocation.map(Number),
                guessedLocation: guessedLocation.map(Number)
            }
        });

        res.json({ scoreId: score.id });
    } catch (error) {
        console.error('Save score error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Complete a game
router.post('/game/:gameId/complete', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { gameId } = req.params;
        const { grade, totalScore } = req.body;

        // Verify game belongs to user
        const game = await prisma.game.findFirst({
            where: {
                id: gameId,
                playerId: userId
            },
            include: {
                scores: true
            }
        });

        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        // Only complete games with exactly 5 rounds
        if (game.scores.length !== 5) {
            return res.status(400).json({ error: 'Game must have exactly 5 rounds to be completed' });
        }

        // Calculate XP earned (10% of average score)
        const xpEarned = Math.round(totalScore / 5 * 0.1);

        // Update game
        const updatedGame = await prisma.game.update({
            where: { id: gameId },
            data: {
                completedAt: new Date(),
                grade,
                xpEarned
            }
        });

        // Update user XP and level
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) {
            const newXp = user.xp + xpEarned;
            const addLevel = Math.floor(newXp / 1000); // Level up every 1000 XP
            const updatedXp = addLevel > 0 ? newXp - (addLevel * 1000) : newXp;

            await prisma.user.update({
                where: { id: userId },
                data: {
                    xp: updatedXp,
                    level: user.level + addLevel
                }
            });
        }

        res.json({ 
            game: updatedGame,
            xpEarned,
            message: 'Game completed successfully' 
        });
    } catch (error) {
        console.error('Complete game error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user's game history
router.get('/user/games', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const limit = parseInt(req.query.limit as string) || 10;
        
        const games = await prisma.game.findMany({
            where: {
                playerId: userId,
                completedAt: { not: null }
            },
            include: {
                scores: true
            },
            orderBy: {
                completedAt: 'desc'
            },
            take: limit
        });

        res.json(games);
    } catch (error) {
        console.error('Get games error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get recent games from all users
router.get('/games/recent', authenticateToken, async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 5;
        console.log(`Fetching recent games with limit: ${limit}`);
        
        const games = await prisma.game.findMany({
            where: {
                completedAt: { not: null }
            },
            include: {
                scores: true,
                player: {
                    select: {
                        username: true,
                        level: true,
                        emailVerified: true,
                        studentVerified: true,
                        school: {
                            select: {
                                name: true,
                                acronym: true,
                                badge: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                completedAt: 'desc'
            },
            take: limit
        });

        console.log(`Found ${games.length} completed games`);

        // Calculate stats for each game
        const gamesWithStats = games.map(game => {
            const totalPoints = game.scores.reduce((sum, score) => sum + score.points, 0);
            const averageScore = game.scores.length > 0 ? Math.round(totalPoints / game.scores.length) : 0;
            const averageDistance = game.scores.length > 0 ? Math.round(game.scores.reduce((sum, score) => sum + score.distance, 0) / game.scores.length) : 0;
            
            // Use the exact S-rank thresholds that match the frontend calculation
            const sRankThresholds: Record<string, number> = {
                'ubc': 42933,      // Large campus - highest S rank requirement (size ~2273m)
                'sfu': 39590,      // Large campus (size ~1837m) 
                'uofa': 37246,     // Large campus (size ~1601m)
                'uvic': 36024,     // Medium-large campus (size ~1485m) 
                'queens': 34192,   // Medium campus (size ~1347m)
                'bcit': 31360,     // Medium campus (size ~1175m)
                'uc': 30538,       // Medium campus (size ~1123m)
                'vcc': 29326,      // Small-medium campus (size ~1046m)
                'dc': 27503,       // Small campus (size ~932m)
                'lc': 26680        // Small campus (size ~880m)
            };
            
            // Calculate grade using same campus-specific system as ResultsScreen
            const getGrade = (score: number, campus: string): string => {
                const sRankThreshold = sRankThresholds[campus.toLowerCase()] || 31360; // Default to bcit level
                
                // Grade thresholds based on S rank (same as ResultsScreen)
                const aRankThreshold = Math.round(sRankThreshold * 0.86);
                const bRankThreshold = Math.round(sRankThreshold * 0.70);
                const cRankThreshold = Math.round(sRankThreshold * 0.51);
                const dRankThreshold = Math.round(sRankThreshold * 0.35);
                
                if (score >= sRankThreshold) return 'S';
                if (score >= aRankThreshold) return 'A';
                if (score >= bRankThreshold) return 'B';
                if (score >= cRankThreshold) return 'C';
                if (score >= dRankThreshold) return 'D';
                return 'F';
            };

            const gameData = {
                id: game.id,
                username: game.player.username,
                level: game.player.level,
                emailVerified: game.player.emailVerified,
                studentVerified: game.player.studentVerified,
                school: game.player.school,
                campus: game.campus || 'Unknown',
                totalPoints,
                averageScore,
                averageDistance,
                grade: getGrade(totalPoints, game.campus || 'Unknown'),
                completedAt: game.completedAt
            };
            
            console.log(`Game: ${gameData.username} - ${gameData.campus}, Points: ${gameData.totalPoints}, Grade: ${gameData.grade}, S-threshold: ${sRankThresholds[game.campus?.toLowerCase() || ''] || 31360}`);
            return gameData;
        });

        console.log(`Returning ${gamesWithStats.length} games with stats`);
        res.json(gamesWithStats);
    } catch (error) {
        console.error('Get recent games error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;