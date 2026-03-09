import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import https from 'https';
import fs from 'fs';
import path from 'path';
import passport from './config/passport';
import postRoutes from './routes/post.routes';
import aiRoutes from './routes/ai.routes';
import analyticsRoutes from './routes/analytics.routes';
import contentRoutes from './routes/content.routes';
import authRoutes from './routes/auth.routes';
import instagramRoutes from './routes/instagram.routes';
import youtubeRoutes from './routes/youtube.routes';
import dashboardRoutes from './routes/dashboard.routes';
import whatsappRoutes from './routes/whatsapp.routes';
import userRoutes from './routes/user.routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3001);
const HTTPS_ENABLED = process.env.HTTPS_ENABLED === 'true';
const HTTPS_PORT = Number(process.env.HTTPS_PORT || PORT);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Routes
app.use('/api', authRoutes);
app.use('/api', instagramRoutes);
app.use('/api', youtubeRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', postRoutes);
app.use('/api', aiRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', contentRoutes);
app.use('/api', userRoutes);
app.use('/webhooks', whatsappRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use(errorHandler);

const startServer = () => {
  if (HTTPS_ENABLED) {
    try {
      const keyPath = process.env.SSL_KEY_PATH || path.resolve(__dirname, '../certs/key.pem');
      const certPath = process.env.SSL_CERT_PATH || path.resolve(__dirname, '../certs/cert.pem');

      const sslOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };

      https.createServer(sslOptions, app).listen(HTTPS_PORT, () => {
        console.log(`🔒 HTTPS server running on port ${HTTPS_PORT}`);
        console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      });
    } catch (error) {
      console.error('Failed to start HTTPS server:', error);
      console.log('Falling back to HTTP...');
      app.listen(PORT, () => {
        console.log(`🚀 HTTP server running on port ${PORT}`);
        console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      });
    }
  } else {
    app.listen(PORT, () => {
      console.log(`🚀 HTTP server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  }
};

startServer();

export default app;
