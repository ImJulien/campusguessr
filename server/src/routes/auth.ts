import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();
const router = express.Router();

router.post('/register', async (req: Request, res: Response) => {

});

router.post('/login', async (req: Request, res: Response) => {

});

export default router;

