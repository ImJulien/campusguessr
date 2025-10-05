import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();
const router = express.Router();


// Registration function
router.post('/register', async (req: Request, res: Response) => {
    const {email,username,password}: {email: string; username: string; password: string} = req.body;
    const domain = email.match(/@(?:[^.]+\.)*([^.]+\.[^.]+)$/)?.[1];

    const domains = await prisma.school.findFirst({
        where: { domain }
    });
    console.log('Domain: ', {domains});

    const schoolId = domains ? domains.id : null;
    console.log('School ID: ', schoolId);

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = schoolId ? await prisma.user.create({
                data: {
                    email,
                    username,
                    password: hashedPassword,
                    schoolId
                }
            }) : await prisma.user.create({
                data: {
                    email,
                    username,
                    password: hashedPassword
                }
            });
        
        console.log('Registered user:', user);

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

