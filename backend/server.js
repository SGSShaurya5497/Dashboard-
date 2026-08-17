const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

// Initialize DB (creates file + seeds users if first run)
require('./db');

const authRoutes  = require('./routes/auth');
const leadsRoutes = require('./routes/leads');
const gymsRoutes  = require('./routes/gyms');

const app = express();
const PORT = process.env.PORT || 3001;
// Resolve static assets directory with multiple candidate fallbacks for Vercel & local
const candidateDirs = [
  path.join(__dirname, 'public'),
  path.join(process.cwd(), 'backend', 'public'),
  path.join(process.cwd(), 'public'),
  path.join(__dirname, '..', 'backend', 'public'),
];

let PUBLIC = candidateDirs.find(dir => {
  try {
    return fs.existsSync(path.join(dir, 'index.html'));
  } catch {
    return false;
  }
}) || path.join(__dirname, 'public');

const IS_PROD = Boolean(
  process.env.VERCEL ||
  process.env.NODE_ENV === 'production' ||
  fs.existsSync(path.join(PUBLIC, 'index.html'))
);

// In dev, allow Vite dev server origin; in prod, same-origin so no CORS needed
if (!IS_PROD) {
  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }));
}

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth',  authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/gyms',  gymsRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Serve built frontend
app.use(express.static(PUBLIC));

// Client-side routing fallback (for all non-API GET requests)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  const indexPath = path.join(PUBLIC, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  return res.status(404).send('Gymmer Dashboard: index.html not found. Please verify build step.');
});

if (require.main === module) {
  app.listen(PORT, () => {
    const mode = IS_PROD ? 'production' : 'development';
    console.log(`🏋️  Gymmer Sales Tracker [${mode}] running on http://localhost:${PORT}`);
  });
}

module.exports = app;
