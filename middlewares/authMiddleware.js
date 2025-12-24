//middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY || 'your_default_secret_key';

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, secretKey, (err, decodedToken) => {
      if (err) {
        console.error('JWT Verification Error:', err); // Add detailed logging
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Token expired. Please log in again.' });
        }
        return res.status(403).json({ error: 'Invalid token' });
      }

      req.userData = { userId: decodedToken.userId, email: decodedToken.email };
      next();
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};
