import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import verifyEmailRoutes from './routes/verify-email';
import gameRoutes from './routes/game';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Enable CORS for frontend on port 3000
app.use(cors({
  origin: 'http://localhost:3000', // ← Change from 5173 to 3000
  credentials: true
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/email', verifyEmailRoutes);
app.use('/api/game', gameRoutes);

// Add Google Maps API key endpoint
app.get('/api/maps-key', (req: Request, res: Response) => {
  res.json({ key: process.env.VITE_GOOGLE_MAPS_API_KEY });
});

app.get('/', (req: Request, res: Response) => {
  res.send('Root works!');
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});