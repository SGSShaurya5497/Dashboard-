const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

// Initialize DB (creates file + seeds users if first run)
require('./db');

const authRoutes  = require('./routes/auth');
const leadsRoutes = require('./routes/leads');

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = fs.existsSync(path.join(__dirname, 'public', 'index.html'));

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

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Serve built frontend in production
if (IS_PROD) {
  const PUBLIC = path.join(__dirname, 'public');
  app.use(express.static(PUBLIC));
  // Client-side routing fallback
  app.get('*', (req, res) => res.sendFile(path.join(PUBLIC, 'index.html')));
}

app.listen(PORT, () => {
  const mode = IS_PROD ? 'production' : 'development';
  console.log(`🏋️  Gymmer Sales Tracker [${mode}] running on http://localhost:${PORT}`);
});
