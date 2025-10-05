import express, { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();
const router = express.Router();

router.post('/verify-school-email', async (req: Request, res: Response) => {
    const { schoolEmail } = req.body;
    const domain = schoolEmail.split('@')[1];

    const school = await prisma.school.findUnique({ where: { domain } });

    if (!school) {
        return res.status(400).json({ error: 'School not supported' });
    }

    // TODO: add logic to send verification email here
    res.json({ message: 'Verification email sent' });
});

export default router;