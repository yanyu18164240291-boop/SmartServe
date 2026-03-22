const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';

router.post('/register', (req, res) => {
  const { username, password, role } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  // Assign role based on requested role, default 'user'
  const assignedRole = role === 'admin' ? 'admin' : 'user';

  db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`, 
    [username, password, assignedRole], 
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      
      const token = jwt.sign({ id: this.lastID, username, role }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user: { id: this.lastID, username, role } });
  });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: row.id, username: row.username, role: row.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: row.id, username: row.username, role: row.role } });
  });
});

// Middleware to verify JWT
router.verifyToken = (req, res, next) => {
  const bearerHeader = req.headers['authorization'];
  if (!bearerHeader) return res.status(401).json({ error: 'Unauthorized' });

  const token = bearerHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

module.exports = router;
