const express = require('express');
const cors = require('cors');
require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is missing. Server refusing to start.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

const helmet = require('helmet');
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: function (origin, callback) {
    // Allow all vercel.app subdomains, ulmgh-369.com domains, localhost, capacitor, and any custom domain set via env
    const allowed = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://localhost',
      'capacitor://localhost',
      'https://369-bay.vercel.app',
      'https://ulmgh-369.com',
      'https://www.ulmgh-369.com',
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    // DEV ONLY - REMOVE BEFORE LAUNCH: allow local WiFi addresses (192.168.x.x:5173)
    const isDevLocalWifi = /^http:\/\/192\.168\.\d+\.\d+:5173$/.test(origin);
    const isUlmghDomain = /^(https?:\/\/)?([a-z0-9-]+\.)*ulmgh-369\.com(:\d+)?$/i.test(origin);

    if (!origin || allowed.includes(origin) || /\.vercel\.app$/.test(origin) || isUlmghDomain || isDevLocalWifi) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true
}));
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

app.set('trust proxy', 1);

const { generalLimiter } = require('./utils/rateLimiter');
app.use(generalLimiter);

const path = require('path');

app.use('/api/general', require('./routes/general'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/upload', require('./routes/upload'));
app.use('/api/vendorAuth', require('./routes/vendorAuth').router);
app.use('/api/vendor', require('./routes/vendor'));
app.use('/api/supportAuth', require('./routes/supportAuth').router);
app.use('/api/support', require('./routes/support'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/offers', require('./routes/offers'));
app.use('/api/advertisements', require('./routes/advertisements'));
app.use('/api/faqs', require('./routes/faqs'));

app.use((req, res) => res.status(404).json({ error: 'API route not found' }));

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = app;
