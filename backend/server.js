const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'wt2-backend' });
});

app.use((err, req, res, next) => {
  res.status(500).json({ success: false, message: err.message || 'Server error' });
});

async function start() {
  app.listen(PORT, HOST, () => {
    console.log('Server running at:');
    console.log('  http://localhost:' + PORT + '/health');
    console.log('  http://localhost:' + PORT + '/api/login');
  });
  try {
    await connectDB();
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    console.error('Fix MONGO_URI in .env and restart. /health will still work.');
  }
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
