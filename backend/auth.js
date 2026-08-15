const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'gymmer-sales-tracker-secret-2024';
const JWT_EXPIRES = '8h';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

module.exports = { signToken, requireAuth, JWT_SECRET };
