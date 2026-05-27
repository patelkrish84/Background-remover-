require('dotenv').config();
require('./firebase');

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const downloadModel = require('./downloadModel');

const app = express();
app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://background-remover-silk-three.vercel.app',
  'https://background-remover-m2tq.onrender.com',
];

const allowedOrigins = [
  ...defaultOrigins,
  ...(process.env.CORS_ORIGINS || '').split(','),
  process.env.FRONTEND_URL,
]
  .filter(Boolean)
  .map(origin => origin.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    return true;
  }

  try {
    const { hostname } = new URL(origin);
    return hostname === 'vercel.app' || hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
};

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/', limiter);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/images', require('./routes/images'));
app.use('/api/payments', require('./routes/payments'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', database: 'firebase', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
const provider = process.env.BACKGROUND_REMOVAL_PROVIDER || 'auto';
const shouldPrepareLocalModel = provider === 'local' || (provider === 'auto' && !process.env.REMOVAL_BG_API_KEY);

const prepareBackgroundRemoval = shouldPrepareLocalModel ? downloadModel() : Promise.resolve();

prepareBackgroundRemoval
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Firebase backend running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to prepare U-2-Net model:', error.message);
    process.exit(1);
  });
