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

const rawConnectionString = process.env.GYMWARD_DB_URL || process.env.DATABASE_URL || 'postgresql://gymward:gymward_secure_pass_2026@gymward.in:5432/gymward';

/**
 * Clean and prepare connection configuration.
 * Self-hosted Dokploy VPS (gymward.in) runs without SSL.
 * If sslmode=require was passed in Vercel, strip it and force sslmode=disable.
 */
function prepareConnection(rawUrl) {
  if (!rawUrl) return { url: rawUrl, ssl: false };

  const lower = rawUrl.toLowerCase();

  const isCloudProvider =
    lower.includes('render.com') ||
    lower.includes('neon.tech') ||
    lower.includes('supabase.co') ||
    lower.includes('rds.amazonaws.com');

  const isSelfHosted =
    lower.includes('gymward.in') ||
    lower.includes('200.234.43.35') ||
    lower.includes('localhost') ||
    lower.includes('127.0.0.1');

  // Dokploy / self-hosted VPS does not support SSL
  if (isSelfHosted || (!isCloudProvider && !lower.includes('sslmode=require'))) {
    let cleaned = rawUrl
      .replace(/([?&])sslmode=[^&]*/gi, '')
      .replace(/([?&])ssl=[^&]*/gi, '')
      .replace(/\?&/, '?')
      .replace(/[?&]$/, '');
    const sep = cleaned.includes('?') ? '&' : '?';
    return {
      url: cleaned + sep + 'sslmode=disable',
      ssl: false,
    };
  }

  // Cloud managed DBs that require SSL
  return {
    url: rawUrl,
    ssl: { rejectUnauthorized: false },
  };
}

let pool = null;

if (rawConnectionString) {
  const { url: connectionString, ssl: sslConfig } = prepareConnection(rawConnectionString);

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
  prepareConnection,
};
