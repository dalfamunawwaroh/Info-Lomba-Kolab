import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { PORT } from './config/index.js';
import { initMySQL, isMySQLConnected } from './db/mysql.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import startupRoutes from './routes/startupRoutes.js';
import competitionRoutes from './routes/competitionRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import advisorRoutes from './routes/advisorRoutes.js';
import broadcastRoutes from './routes/broadcastRoutes.js';
import statsRoutes from './routes/statsRoutes.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Initialize MySQL Database Connection & Migrations
initMySQL();

// API Health Check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Info Lomba Ko+Lab Backend API',
    database: isMySQLConnected() ? 'MySQL (Connected)' : 'JSON Database (Fallback)',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API Routes (Mounted under /api/v1)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/startups', startupRoutes);
app.use('/api/v1/competitions', competitionRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/submissions', submissionRoutes);
app.use('/api/v1/advisors', advisorRoutes);
app.use('/api/v1/broadcasts', broadcastRoutes);
app.use('/api/v1/admin/stats', statsRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint tidak ditemukan: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan pada server backend',
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` 🚀 Info Lomba Ko+Lab Backend Server Active`);
  console.log(` 🌐 Server URL : http://localhost:${PORT}`);
  console.log(` 📡 API Prefix : http://localhost:${PORT}/api/v1`);
  console.log(`=======================================================`);
});
