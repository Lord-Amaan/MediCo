require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const interactionRoutes = require('./routes/interactions');

const app = express();

// Middleware
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(bodyParser.json({ limit: '15mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '15mb' }));

// Database Connection
const mongoURI = process.env.MONGODB_URI;
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✓ MongoDB connected'))
.catch((err) => console.error('✗ MongoDB connection error:', err));

// ============================================================================
// ROUTES
// ============================================================================

// Auth routes (public)
app.use('/api/auth', require('./routes/auth'));

// Hospital routes (public)
app.use('/api/hospitals', require('./routes/hospitals'));

// User routes (protected)
app.use('/api/users', require('./routes/users'));

// Transfer routes (protected)
app.use('/api/transfers', require('./routes/transfers'));

// Scan report route
app.use('/api', require('./routes/scanReport'));

app.use('/api', interactionRoutes);

// ============================================================================
// HEALTH CHECK
// ============================================================================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Server is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date(),
  });
});

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: err.message || 'Something went wrong!',
    timestamp: new Date(),
  });
});

// ============================================================================
// 404 HANDLER
// ============================================================================
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});
