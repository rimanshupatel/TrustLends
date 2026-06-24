import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db';
import apiRouter from './routes';
import authRouter from './routes/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup to allow request origins dynamically
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or postman)
    if (!origin) return callback(null, true);
    
    // Check if origin matches allowed patterns: localhost, local network (192.168.x.x), or process.env.FRONTEND_URL
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
    const isLocalIP = /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin);
    const isFrontendUrl = process.env.FRONTEND_URL && origin.startsWith(process.env.FRONTEND_URL);

    if (isLocalhost || isLocalIP || isFrontendUrl) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
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
