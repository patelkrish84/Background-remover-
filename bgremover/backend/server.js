require('dotenv').config();
require('./firebase');

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const downloadModel = require('./downloadModel');

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));
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

downloadModel()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Firebase backend running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to prepare U-2-Net model:', error.message);
    process.exit(1);
  });
