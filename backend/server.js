const express = require('express');
const cors = require('cors');
const result = require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const db = require('./db');
const authRoutes = require('./routes/auth');
const knowledgeRoutes = require('./routes/knowledge');
const chatRoutes = require('./routes/chat');

app.use('/api/auth', authRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/chat', chatRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
