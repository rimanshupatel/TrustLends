import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db';
import apiRouter from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup to allow request origins from frontend dev server
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api', apiRouter);

// Healthcheck Route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Initialize connection and start server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Express server running on http://localhost:${PORT}`);
  });
};

startServer();
