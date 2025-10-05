import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import verifyEmailRoutes from './routes/verify-email'; 
import dbRoutes from './routes/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/email', verifyEmailRoutes); 
app.use('/api/db', dbRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Root works!');
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});