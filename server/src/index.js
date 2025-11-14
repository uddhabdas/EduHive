require('dotenv').config();

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
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set');

    await mongoose.connect(process.env.MONGODB_URI, {
      // options kept minimal; mongoose 8 uses drivers with sane defaults
    });

    app.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
