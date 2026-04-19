require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const { errorHandler } = require('./middleware/errorHandler');
const { defaultLimiter } = require('./middleware/rateLimiter');

const app = express();

// Security & logging
app.use(helmet());
app.use(morgan('dev'));

// CORS — allow web client, Flutter Android emulator, Flutter iOS simulator
app.use(cors({
  origin: [
    process.env.CLIENT_WEB_URL    || 'http://localhost:5173',
    process.env.CLIENT_MOBILE_URL || 'exp://localhost:8081',
    'http://10.0.2.2:8081',
    'http://localhost:8081',
  ],
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global rate limiter
app.use(defaultLimiter);

// Health check
app.get('/health', (req, res) => res.json({
  status:    'ok',
  app:       'IUEA Library API',
  version:   '1.0.0',
  timestamp: new Date(),
}));

// Routes
app.use('/api/auth',       require('./routes/auth.routes'));
app.use('/api/books',      require('./routes/books.routes'));
app.use('/api/library',    require('./routes/library.routes'));
app.use('/api/chat',       require('./routes/chat.routes'));
app.use('/api/progress',   require('./routes/progress.routes'));
app.use('/api/audio',      require('./routes/audio.routes'));
app.use('/api/translate',  require('./routes/translation.routes'));
app.use('/api/podcasts',   require('./routes/podcast.routes'));
app.use('/api/admin',      require('./routes/admin.routes'));

// 404
app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
