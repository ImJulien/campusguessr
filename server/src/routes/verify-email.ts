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

    const token = crypto.randomBytes(32).toString('hex');

    await prisma.user.update({
        where: { id: userId },
        data: { verificationToken: token }
    });

    await resend.emails.send({
        from: 'CampusGuessr <onboarding@resend.dev>',
        to: user.email,
        subject: 'Verify your email',
        html: `<a href="http://localhost:3000/verify?token=${token}">Verify Email</a>`,
    });

    res.json({ message: 'Email sent' });
});

router.get('/verify', async (req: Request, res: Response) => {
    const { token } = req.query;

    const user = await prisma.user.findFirst({
        where: { verificationToken: token as string }
    });

    if (!user) {
        return res.status(400).json({ error: 'Invalid token' });
    }

    await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, verificationToken: null }
    });
    res.json({ message: 'Email verified' });
});

export default router;

