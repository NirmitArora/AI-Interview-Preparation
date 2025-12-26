// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (one level up from server folder)
const envPath = path.join(__dirname, '..', '.env');
const envResult = dotenv.config({ path: envPath });

// #region agent log
fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/index.js:10',message:'dotenv.config called',data:{envPath,error:envResult.error?.message,parsed:!!envResult.parsed},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,E'})}).catch(()=>{});
// #endregion

console.log('📁 Loading .env from:', envPath);

// #region agent log
fetch('http://127.0.0.1:7242/ingest/832a3223-a1b4-48bb-b68e-0a35862dda47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/index.js:12',message:'After dotenv.config - checking env vars',data:{geminiKeyPresent:!!process.env.GEMINI_API_KEY,geminiKeyLength:process.env.GEMINI_API_KEY?.length||0,geminiKeyPrefix:process.env.GEMINI_API_KEY?.substring(0,8)||'N/A',geminiModel:process.env.GEMINI_MODEL||'default'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,E'})}).catch(()=>{});
// #endregion

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import passport from 'passport';

// Import routes
import authRoutes from './routes/auth.js';
import interviewRoutes from './routes/interviews.js';
import analyticsRoutes from './routes/analytics.js';
import aiRoutes from './routes/ai.js';

// Import models
import './models/User.js';
import './models/Interview.js';
import './models/Question.js';
import './models/Answer.js';
import './models/Analytics.js';

// Import passport config
import './config/passport.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration (allow localhost on any port in development)
app.use(cors({
  origin: [/^http:\/\/localhost:\d+$/],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Passport middleware
app.use(passport.initialize());

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/interview-ai-prep')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    bypassAuth: process.env.BYPASS_AUTH === 'true' || process.env.BYPASS_AUTH === '1'
  });
});

// AI Service test endpoint
app.get('/api/test-ai', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    
    if (!apiKey) {
      return res.status(500).json({
        status: 'ERROR',
        message: 'GEMINI_API_KEY not found in environment variables',
        apiKeyPresent: false,
        modelName
      });
    }
    
    // Test the API key by making a simple request
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const testPrompt = 'Say "Hello" in one word.';
    const result = await model.generateContent(testPrompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({
      status: 'SUCCESS',
      message: 'AI service is working correctly',
      apiKeyPresent: true,
      apiKeyLength: apiKey.length,
      apiKeyPrefix: apiKey.substring(0, 8) + '...',
      modelName,
      testResponse: text.trim(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI test error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: error.message || 'Failed to test AI service',
      errorCode: error.code || error.status,
      errorName: error.name,
      apiKeyPresent: !!process.env.GEMINI_API_KEY,
      modelName: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      details: error.response?.data || error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
