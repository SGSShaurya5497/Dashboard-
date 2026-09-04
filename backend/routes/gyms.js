const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pgDb = require('../pgDb');
const { requireAuth } = require('../auth');
const { slugifyGymName, generateRandom3Digits, generateSecurePassword } = require('../utils/generator');

// Ensure plain_password column exists on startup
pgDb.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS plain_password character varying(255)').catch(err => {
  console.warn('Note: users table plain_password check:', err.message);
});

// All gym management routes require auth
router.use(requireAuth);

const BCRYPT_SALT_ROUNDS = 12;

/**
 * Format a slug or email into a readable display name if gym_profile is not yet linked
 * e.g. "iron-edge-fitness" -> "Iron Edge Fitness"
 */
function formatNameFromSlug(slug) {
  if (!slug) return 'Gym';
  // If it's an email with @, take the part before @
  const namePart = slug.includes('@') ? slug.split('@')[0] : slug;
  return namePart
    .split(/[-_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format database errors with actionable advice for self-hosted / VPS databases
 */
function formatDbError(err, defaultMsg) {
  if (!err) return defaultMsg;
  const msg = err.message || '';
  if (err.code === 'ETIMEDOUT' || msg.toLowerCase().includes('timeout')) {
    return 'Connection to VPS PostgreSQL timed out. Please check that port 5432 is open and allowed in your VPS firewall / Dokploy settings.';
  }
  if (err.code === 'ECONNREFUSED') {
    return 'Connection refused by VPS. Please verify PostgreSQL is running and port 5432 is published on Dokploy.';
  }
  if (msg.includes('Connection terminated unexpectedly')) {
    return 'Connection terminated unexpectedly. If your database is hosted on Dokploy/VPS, ensure port 5432 is directly mapped and SSL is not forced.';
  }
  if (msg.includes('not configured')) {
    return msg;
  }
  return msg || defaultMsg;
}

/**
 * Helper to check if a username (email) already exists in Postgres users table
 */
async function isUsernameTaken(username) {
  const res = await pgDb.query('SELECT 1 FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [username.trim()]);
  return res.rows.length > 0;
}

/**
 * Helper to generate a unique username given a gym name, resolving collisions with 3-digit suffix
 */
async function generateUniqueUsername(gymName) {
  let baseSlug = slugifyGymName(gymName);
  if (!baseSlug) baseSlug = 'gym';

  let candidate = baseSlug;
  let taken = await isUsernameTaken(candidate);

  let attempts = 0;
  while (taken && attempts < 10) {
    const randomDigits = generateRandom3Digits();
    candidate = `${baseSlug}-${randomDigits}`;
    taken = await isUsernameTaken(candidate);
    attempts++;
  }

  return candidate;
}

/**
 * GET /api/gyms/suggest-username?name=...
 * Generates an initial username suggestion and password for the modal form
 */
router.get('/suggest-username', async (req, res) => {
  const { name } = req.query;
  const gymName = (name || '').trim();
  try {
    const username = gymName ? await generateUniqueUsername(gymName) : '';
    const password = generateSecurePassword(10);
    return res.json({ username, password });
  } catch (err) {
    console.error('Error suggesting username from DB:', err.message);
    // Gracefully fallback to slugified name and password if DB is unreachable
    const fallbackUsername = gymName ? slugifyGymName(gymName) : '';
    const password = generateSecurePassword(10);
    return res.json({ username: fallbackUsername, password });
  }
});

/**
 * GET /api/gyms
 * Returns running list of created gyms (name, username, and password)
 */
router.get('/', async (req, res) => {
  try {
    const queryText = `
      SELECT 
        u.id, 
        u.email AS username,
        u.plain_password,
        u.gym_id,
        g.name AS gym_name
      FROM users u
      LEFT JOIN gym_profile g ON u.gym_id = g.id
      WHERE u.role = 'owner'
      ORDER BY u.id DESC
    `;
    const result = await pgDb.query(queryText);
    
    const gyms = result.rows.map(row => ({
      id: row.id,
      username: row.username,
      password: row.plain_password || null,
      gym_name: row.gym_name || formatNameFromSlug(row.username),
      gym_id: row.gym_id,
    }));

    return res.json(gyms);
  } catch (err) {
    console.error('Error fetching gyms from Postgres:', err);
    return res.status(500).json({ error: formatDbError(err, 'Failed to fetch gyms list from database') });
  }
});

/**
 * POST /api/gyms
 * Creates a new gym owner user in Postgres users table
 */
router.post('/', async (req, res) => {
  try {
    const { gym_name, username: requestedUsername, password: requestedPassword } = req.body;

    if (!gym_name || !gym_name.trim()) {
      return res.status(400).json({ error: 'Gym name is required' });
    }

    const trimmedGymName = gym_name.trim();

    // Determine final username
    let finalUsername = (requestedUsername || '').trim();
    if (!finalUsername) {
      finalUsername = await generateUniqueUsername(trimmedGymName);
    } else {
      // If manually entered username already exists, check collision
      const taken = await isUsernameTaken(finalUsername);
      if (taken) {
        // Append 3-digit number to make unique or inform user
        const autoResolved = await generateUniqueUsername(finalUsername);
        finalUsername = autoResolved;
      }
    }

    // Determine password
    const plainPassword = (requestedPassword && requestedPassword.trim())
      ? requestedPassword.trim()
      : generateSecurePassword(10);

    // Hash password with bcrypt (12 salt rounds)
    const hashedPassword = await bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS);

    // Generate UUID string for id
    const userId = crypto.randomUUID();

    // Insert into Postgres users table
    const insertQuery = `
      INSERT INTO users (
        id,
        email,
        hashed_password,
        plain_password,
        role,
        gym_id,
        must_reset_password
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, role, gym_id, must_reset_password, plain_password
    `;

    const values = [
      userId,
      finalUsername,
      hashedPassword,
      plainPassword,
      'owner',
      null,
      false,
    ];

    await pgDb.query(insertQuery, values);

    // Return response with credentials
    return res.status(201).json({
      success: true,
      gym: {
        id: userId,
        gym_name: trimmedGymName,
        username: finalUsername,
        password: plainPassword,
      },
    });
  } catch (err) {
    console.error('Error creating gym owner user in Postgres:', err);
    return res.status(500).json({ error: formatDbError(err, 'Failed to create gym account in database') });
  }
});

/**
 * PUT /api/gyms/:id/password
 * Updates/resets password for an existing gym owner account
 */
router.put('/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const newPassword = (password && password.trim())
      ? password.trim()
      : generateSecurePassword(10);

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    const updateQuery = `
      UPDATE users
      SET hashed_password = $1, plain_password = $2
      WHERE id = $3 AND role = 'owner'
      RETURNING id, email, plain_password
    `;

    const result = await pgDb.query(updateQuery, [hashedPassword, newPassword, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Gym owner account not found' });
    }

    return res.json({
      success: true,
      message: 'Password updated successfully',
      password: newPassword,
      username: result.rows[0].email,
    });
  } catch (err) {
    console.error('Error updating gym password:', err);
    return res.status(500).json({ error: formatDbError(err, 'Failed to update gym password') });
  }
});

/**
 * POST /api/gyms/bulk-reset-passwords
 * Generates new passwords for all gyms that have plain_password = NULL
 */
router.post('/bulk-reset-passwords', async (req, res) => {
  try {
    // Find all owner accounts with no stored plain password
    const nullPassResult = await pgDb.query(
      `SELECT id, email FROM users WHERE role = 'owner' AND (plain_password IS NULL OR plain_password = '')`
    );

    if (nullPassResult.rows.length === 0) {
      return res.json({ success: true, updated: [], message: 'All gyms already have stored passwords.' });
    }

    const updated = [];

    for (const row of nullPassResult.rows) {
      const newPassword = generateSecurePassword(10);
      const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
      await pgDb.query(
        `UPDATE users SET hashed_password = $1, plain_password = $2 WHERE id = $3`,
        [hashedPassword, newPassword, row.id]
      );
      updated.push({ id: row.id, username: row.email, password: newPassword });
    }

    return res.json({ success: true, updated, message: `Passwords generated for ${updated.length} gym(s).` });
  } catch (err) {
    console.error('Error bulk resetting passwords:', err);
    return res.status(500).json({ error: formatDbError(err, 'Failed to bulk reset passwords') });
  }
});

module.exports = router;

