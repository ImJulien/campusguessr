import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load .env FIRST before importing routes
dotenv.config();

import authRoutes from './routes/auth';
import verifyEmailRoutes from './routes/verify-email';
import gameRoutes from './routes/game';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/email', verifyEmailRoutes);
app.use('/api/game', gameRoutes);

// Maps key endpoint
app.get('/api/maps-key', (req: Request, res: Response) => {
  console.log('API Key check:', process.env.GOOGLE_MAPS_API_KEY); // Debug log
  res.json({ key: process.env.GOOGLE_MAPS_API_KEY });
});

app.get('/', (req: Request, res: Response) => {
  res.send('Root works!');
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Google Maps Key loaded:', process.env.GOOGLE_MAPS_API_KEY ? 'YES' : 'NO');
});