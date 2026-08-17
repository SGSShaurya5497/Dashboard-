const { Pool } = require('pg');

const connectionString = process.env.GYMWARD_DB_URL || 'postgresql://gymmer_user:DaPN62LUCrkS5LhoL8Csj1Ws8dtqGTUo@dpg-d9rhm8qjnfac73fo1hhg-a.oregon-postgres.render.com/gymmer';

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
