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

    const user = await prisma.user.findFirst({
        where: { verificationToken: token as string }
    });
    console.log('User found for verification:', user);

    if (!user) {
        return res.status(400).json({ error: 'Invalid token' });
    }

    const schoolConfirmed = user.schoolEmail ? true : false;
    console.log('School email confirmed:', schoolConfirmed);

    await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, verificationToken: null, studentVerified: schoolConfirmed }
    });
    res.json({ message: `Email${schoolConfirmed ? '/Student' : ''} verified` });
});

export default router;

