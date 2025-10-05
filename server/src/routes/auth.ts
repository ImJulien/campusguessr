import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();
const router = express.Router();


// Registration function
router.post('/register', async (req: Request, res: Response) => {
    const {email,username,password} = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                username,
                password: hashedPassword
            }
        });
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, username: user.username } });
    } catch (error) {
        res.status(400).json({error: 'User already exists'});
    }
});


// Login function
router.post('/login', async (req: Request, res: Response) => {
    const {email, password} = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid email or password'});
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username } });
});

export default router;

