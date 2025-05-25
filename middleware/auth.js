const { verifyToken } = require('../utils/jwt');

function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect('/');

  const decoded = verifyToken(token);
  if (!decoded) {
    console.error('Invalid JWT token');
    return res.redirect('/');
  }

  req.userID = decoded.id;
  next();
}

module.exports = authenticateToken;
