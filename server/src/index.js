// src/index.js
// Safely load .env in development without crashing in production
if (process.env.NODE_ENV !== 'production') {
  try {
    // Loads .env for local development
    require('dotenv').config();
    console.log('Loaded .env for development');
  } catch (err) {
    console.warn('Could not load dotenv in development:', err && err.message);
  }
} else {
  // In production try to load but ignore absence (Render provides env vars)
  try {
    require('dotenv').config();
  } catch (_) {
    // ignore if dotenv isn't installed in production
  }
}

const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const coursesRoutes = require('./routes/courses');
const devRoutes = require('./routes/dev');
const progressRoutes = require('./routes/progress');
const adminRoutes = require('./routes/admin');
const walletRoutes = require('./routes/wallet');
const purchaseRoutes = require('./routes/purchase');
const { auth } = require('./middleware/auth');

const app = express();

// Basic process-level handlers to surface errors in logs
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// Middleware
app.use(cors());
app.use(express.json());
// Serve custom course images if present
app.use('/course-images', express.static(path.join(__dirname, '..', 'public', 'course-images')));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Course routes
app.use('/api', coursesRoutes);

// Progress routes
app.use('/api', progressRoutes);

// Dev routes (seed & imports)
app.use('/api', devRoutes);
app.use('/api/dev', devRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// Wallet routes
app.use('/api/wallet', walletRoutes);

// Purchase routes
app.use('/api', purchaseRoutes);

// Me route (protected)
app.get('/api/me', auth, async (req, res) => {
  try {
    const User = require('./models/User');
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  } catch (e) {
    console.error('GET /api/me error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update own profile (protected)
app.put('/api/me', auth, async (req, res) => {
  try {
    const User = require('./models/User');
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Not found' });

    const { name, email } = req.body;

    if (name !== undefined && name !== null) {
      user.name = name.trim();
    }
    
    if (email && email.trim() && email.trim() !== user.email) {
      const existing = await User.findOne({ email: email.trim() });
      if (existing) return res.status(409).json({ error: 'Email already exists' });
      user.email = email.trim();
    }

    await user.save();
    const userObj = user.toObject();
    delete userObj.password;
    res.json(userObj);
  } catch (e) {
    console.error('PUT /api/me error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    // Validate required environment variables early with clear messages
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set');

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      // mongoose 8 uses sensible defaults; add options if needed
    });
    console.log('Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`API listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err && err.message ? err.message : err);
    // Give a bit of context for deploy logs
    console.error('Environment at startup:', {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      MONGODB_URI_set: !!process.env.MONGODB_URI,
      JWT_SECRET_set: !!process.env.JWT_SECRET,
    });
    process.exit(1);
  }
}

start();
