const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "yourSecretKey"; // better to use env vars

function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      username: user.username
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = {
  generateToken,
  verifyToken
};
