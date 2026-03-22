const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('./auth');
const zhipu = require('../utils/zhipu');

// Get chat sessions
router.get('/sessions', auth.verifyToken, (req, res) => {
  db.all(`SELECT * FROM sessions WHERE user_id = ? ORDER BY updated_at DESC`, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create new session
router.post('/sessions', auth.verifyToken, (req, res) => {
  const title = req.body.title || '新对话';
  db.run(`INSERT INTO sessions (user_id, title) VALUES (?, ?)`, [req.user.id, title], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, title, updated_at: new Date() });
  });
});

// Get messages for session
router.get('/sessions/:session_id/messages', auth.verifyToken, (req, res) => {
  db.all(`SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC`, [req.params.session_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Send message (RAG logic)
router.post('/sessions/:session_id/message', auth.verifyToken, async (req, res) => {
  const { content } = req.body;
  const sessionId = req.params.session_id;

  if (!content) return res.status(400).json({ error: 'Message content is required' });

  // 1. Save user message
  db.run(`INSERT INTO messages (session_id, role, content) VALUES (?, 'user', ?)`, [sessionId, content]);

  try {
    // 2. Embed user query
    const queryEmbedding = await zhipu.getEmbedding(content);

    // 3. Retrieve context chunks from DB
    db.all(`SELECT id, doc_id, content, embedding FROM document_chunks`, async (err, chunks) => {
      if (err) return res.status(500).json({ error: err.message });

      let scoredChunks = [];
      for (let chunk of chunks) {
        if (!chunk.embedding) continue;
        const emb = JSON.parse(chunk.embedding);
        const score = zhipu.cosineSimilarity(queryEmbedding, emb);
        scoredChunks.push({ score, text: chunk.content });
      }

      scoredChunks.sort((a, b) => b.score - a.score);
      const topChunks = scoredChunks.slice(0, 3).filter(c => c.score > 0.4); // Similarity threshold

      let systemPrompt = `你是一个名为 SmartServe AI 的智能客服助手。你要解答用户的问题。主要依赖于下方提供的知识库片段。如果知识库中包含相关答案，优先使用。如果没有提供知识库内容或内容不相关，你可以依靠自身的知识回答。请用中文回答。`;

      let contextStr = '';
      if (topChunks.length > 0) {
        contextStr = "\n\n知识库片段：\n" + topChunks.map(c => `- ${c.text}`).join('\n');
      }

      const messages = [
        { role: 'system', content: systemPrompt + contextStr },
        { role: 'user', content: content }
      ];

      // 4. Call LLM
      const result = await zhipu.chatCompletion(messages, false); // Turn off stream for simplicity
      const replyContent = result.data.choices[0].message.content;

      // 5. Save assistant message
      db.run(`INSERT INTO messages (session_id, role, content) VALUES (?, 'assistant', ?)`, [sessionId, replyContent], function(errAssis) {
         if (errAssis) return res.status(500).json({ error: errAssis.message });
         res.json({ id: this.lastID, role: 'assistant', content: replyContent });
      });
      // update title if it's new
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

module.exports = router;
