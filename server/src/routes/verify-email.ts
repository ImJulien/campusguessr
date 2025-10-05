import express, { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';
import {Resend} from 'resend';
import crypto from 'crypto';

const prisma = new PrismaClient();
const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY!);

router.post('/send', async (req: Request, res: Response) => {
    const { userId } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        return res.status(400).json({ error: 'User not found' });
    }

    console.log('User:', user);

    const token = crypto.randomBytes(32).toString('hex');

    const updateResult = await prisma.user.update({
        where: { id: userId },
        data: { verificationToken: token }
    });
    console.log('Updated user with token:', updateResult);

    const mailsend = await resend.emails.send({
        from: 'CampusGuessr <no-reply@stormhacks.zokona.ca>',
        to: user.email,
        subject: 'Verify your email',
        html: `<a href="http://localhost:3000/verify?token=${token}">Verify Email</a>`,
    });

    console.log('Email sent:', mailsend);

    res.json({ message: 'Email sent' });
});

router.get('/verify', async (req: Request, res: Response) => {
    const { token } = req.query;
    console.log('Verification token received:', token);

    if (!token) {
        return res.status(400).json({ error: 'Verification token is required' });
    }

    const user = await prisma.user.findFirst({
        where: { verificationToken: token as string },
        include: { school: true }
    });
    console.log('User found for verification:', user);

    if (!user) {
        return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    if (user.emailVerified) {
        return res.status(200).json({ message: 'Email already verified', user: { emailVerified: true, school: user.school } });
    }

    // Check if this is a school email and update verification accordingly
    const schoolConfirmed = user.school ? true : false;
    console.log('School email confirmed:', schoolConfirmed);

    await prisma.user.update({
        where: { id: user.id },
        data: { 
            emailVerified: true, 
            verificationToken: null, 
            studentVerified: schoolConfirmed 
        }
    });

    res.json({ 
        message: `Email${schoolConfirmed ? ' and student status' : ''} verified successfully!`,
        user: {
            emailVerified: true,
            studentVerified: schoolConfirmed,
            school: user.school
        }
    });
});

export default router;

