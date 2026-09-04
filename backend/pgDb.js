const path = require('path');
const fs = require('fs');

// Ensure .env is loaded if running locally or in development
try {
  require('dotenv').config();
  if (!process.env.GYMWARD_DB_URL && !process.env.DATABASE_URL) {
    const rootEnv = path.join(__dirname, '..', '.env');
    if (fs.existsSync(rootEnv)) {
      require('dotenv').config({ path: rootEnv });
    }
  }
} catch {}

const { Pool } = require('pg');

const connectionString = process.env.GYMWARD_DB_URL || process.env.DATABASE_URL || 'postgresql://gymward:gymward_secure_pass_2026@gymward.in:5432/gymward';

/**
 * Determine whether SSL should be used based on URL or environment.
 * - Self-hosted / Dokploy Docker Postgres runs without SSL by default.
 * - Managed clouds (Render, Neon, Supabase) mandate SSL.
 * - Explicit ?sslmode=require or ?sslmode=disable in the URL always takes precedence.
 */
function determineSsl(url) {
  if (!url) return false;
  const lower = url.toLowerCase();

  // Explicitly disabled
  if (lower.includes('sslmode=disable') || process.env.PGSSLMODE === 'disable') {
    return false;
  }

  // Explicitly required
  if (
    lower.includes('sslmode=require') ||
    lower.includes('ssl=true') ||
    process.env.PGSSLMODE === 'require'
  ) {
    return { rejectUnauthorized: false };
  }

  // Cloud providers requiring SSL
  if (
    lower.includes('render.com') ||
    lower.includes('neon.tech') ||
    lower.includes('supabase.co') ||
    lower.includes('rds.amazonaws.com')
  ) {
    return { rejectUnauthorized: false };
  }

  // Default for self-hosted / Dokploy VPS / localhost: no SSL
  return false;
}

let pool = null;

if (connectionString) {
  const sslConfig = determineSsl(connectionString);
  pool = new Pool({
    connectionString,
    ssl: sslConfig,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 8000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err.message);
  });
} else {
  console.warn('⚠️ [PostgreSQL] GYMWARD_DB_URL is not set. Gym account features require GYMWARD_DB_URL configured in Vercel or .env.');
}

module.exports = {
  query: async (text, params) => {
    if (!pool) {
      throw new Error('PostgreSQL database is not configured. Please set the GYMWARD_DB_URL environment variable in Vercel or your .env file.');
    }
    return pool.query(text, params);
  },
  pool,
  determineSsl,
};
