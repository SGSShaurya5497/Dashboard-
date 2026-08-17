const crypto = require('crypto');

/**
 * Slugify a gym name:
 * Lowercase, replace non-alphanumeric characters with hyphens, collapse multiple hyphens, trim hyphens.
 * E.g., "Gold's Gym Center!" -> "golds-gym-center"
 */
function slugifyGymName(name) {
  if (!name) return '';
  return name
    .toString()
    .toLowerCase()
    .trim()
    .replace(/'/g, '')                      // Remove apostrophes: Gold's -> golds
    .replace(/[^a-z0-9]+/g, '-')            // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')                // Remove leading and trailing hyphens
    .replace(/-{2,}/g, '-');                // Collapse multiple hyphens
}

/**
 * Generate a random 3-digit number string (100 - 999)
 */
function generateRandom3Digits() {
  return String(crypto.randomInt(100, 1000));
}

/**
 * Generate a crypto-secure 10-character random password.
 * Explicitly excludes ambiguous characters: '0', 'O', 'l', '1'
 */
const CHARSET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateSecurePassword(length = 10) {
  let password = '';
  const charsetLength = CHARSET.length;
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charsetLength);
    password += CHARSET[randomIndex];
  }
  return password;
}

module.exports = {
  slugifyGymName,
  generateRandom3Digits,
  generateSecurePassword,
};
