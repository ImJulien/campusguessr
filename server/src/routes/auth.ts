import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Resend } from 'resend';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();
const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY!);

// Login function
router.post('/login', async (req: Request, res: Response) => {
    const {email, password} = req.body;

    try {
        const user = await prisma.user.findUnique({ 
            where: { email },
            include: {
                school: true,
                games: {
                    include: {
                        scores: true
                    },
                    orderBy: {
                        startedAt: 'desc'
                    }
                }
            }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Calculate user statistics
        const totalGames = user.games.length;
        const completedGames = user.games.filter(game => game.completedAt).length;
        const totalPoints = user.games.reduce((sum, game) => 
            sum + game.scores.reduce((gameSum, score) => gameSum + score.points, 0), 0
        );
        const averageScore = completedGames > 0 ? Math.round(totalPoints / completedGames) : 0;

        // Recent games (last 5)
        const recentGames = user.games.slice(0, 5).map(game => ({
            id: game.id,
            startedAt: game.startedAt,
            completedAt: game.completedAt,
            totalPoints: game.scores.reduce((sum, score) => sum + score.points, 0),
            rounds: game.scores.length
        }));

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({ 
            token,
            user: {
                id: user.id,
                publicId: user.publicId,
                email: user.email,
                username: user.username,
                school: user.school,
                studentVerified: user.studentVerified,
                emailVerified: user.emailVerified,
                isPremium: user.isPremium,
                xp: user.xp,
                level: user.level,
                stats: {
                    totalGames,
                    completedGames,
                    totalPoints,
                    averageScore,
                    recentGames
                }
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Registration function
router.post('/register', async (req: Request, res: Response) => {
    const {email, username, password}: {email: string; username: string; password: string} = req.body;
    
    try {
        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({ 
                error: existingUser.email === email ? 'Email already registered' : 'Username already taken'
            });
        }

        // Check for school domain
        const domain = email.match(/@(?:[^.]+\.)*([^.]+\.[^.]+)$/)?.[1];
        const school = await prisma.school.findFirst({
            where: { domain }
        });

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                username,
                password: hashedPassword,
                schoolId: school?.id || null,
                studentVerified: Boolean(school),
                verificationToken,
                emailVerified: false
            },
            include: {
                school: true
            }
        });

        // Send verification email
        try {
            await resend.emails.send({
                from: 'CampusGuessr <no-reply@stormhacks.zokona.ca>',
                to: user.email,
                subject: 'Verify your CampusGuessr account',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #667eea;">Welcome to CampusGuessr!</h2>
                        <p>Hi ${user.username},</p>
                        <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}" 
                               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                                Verify Email Address
                            </a>
                        </div>
                        <p>If the button doesn't work, copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #666;">${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}</p>
                        ${school ? `<p style="background: #f0f8ff; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">🎓 <strong>School Email Detected!</strong><br>We've detected that you're using a ${school.name} email address. Once verified, you'll receive a special school badge!</p>` : ''}
                        <p>Best regards,<br>The CampusGuessr Team</p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Continue with registration even if email fails
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(201).json({ 
            token,
            user: {
                id: user.id,
                publicId: user.publicId,
                email: user.email,
                username: user.username,
                school: user.school,
                studentVerified: user.studentVerified,
                emailVerified: user.emailVerified,
                isPremium: user.isPremium,
                xp: user.xp,
                level: user.level,
                stats: {
                    totalGames: 0,
                    completedGames: 0,
                    totalPoints: 0,
                    averageScore: 0,
                    recentGames: []
                }
            },
            message: 'Registration successful! Please check your email to verify your account.'
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Change password function
router.post('/change-password', async (req: Request, res: Response) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'Access token required' });
        }

        // Verify token and get user
        let userId: string;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
            userId = decoded.userId;
        } catch (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }

        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters long' });
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const validCurrentPassword = await bcrypt.compare(currentPassword, user.password);
        if (!validCurrentPassword) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update password in database
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword }
        });

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;

