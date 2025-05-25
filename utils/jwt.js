const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_here'; // keep this consistent
const TOKEN_EXPIRATION = '1d';

// Generate a JWT token for a user
function generateToken(user) {
  const payload = {
    id: user._id,
    username: user.username,
    email: user.email,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
}

// Verify a token string, return decoded payload or null if invalid
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = {
  generateToken,
  verifyToken,
};
