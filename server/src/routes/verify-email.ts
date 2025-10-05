import express, { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();
const crypto = require('crypto');
const router = express.Router();

router.post('/verify-email', async (req: Request, res: Response) => {
    const { email } = req.body;
    const domain = email.split('@')[1];


});

export default router;