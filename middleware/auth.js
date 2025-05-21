const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'yourSecretKey';

function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect('/');

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userID = decoded.id;
    next();
  } catch (err) {
    console.error("JWT error:", err);
    res.redirect('/');
  }
}

module.exports = authenticateToken;
