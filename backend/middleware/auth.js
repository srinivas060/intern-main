const jwt = require('jsonwebtoken');
const db = require('../db');

const auth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await db.query('SELECT id, name, email, role FROM users WHERE id = $1', [decoded.id]);
    if (!result.rows.length) return res.status(401).json({ error: 'User not found' });
    req.user = result.rows[0];
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};

module.exports = { auth, adminOnly };
