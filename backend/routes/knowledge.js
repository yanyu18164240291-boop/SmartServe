const express = require('express');
const router = express.Router();
const multer = require('multer');
// Polyfill for Node 20+ pdf-parse issue
global.DOMMatrix = typeof DOMMatrix !== 'undefined' ? DOMMatrix : class DOMMatrix { constructor() { this.a=1;this.b=0;this.c=0;this.d=1;this.e=0;this.f=0; } };
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');
const db = require('../db');
const auth = require('./auth');
const zhipu = require('../utils/zhipu');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const upload = multer({ dest: uploadDir });

// List Knowledge Bases
router.get('/', auth.verifyToken, (req, res) => {
  db.all(`SELECT * FROM knowledge_bases ORDER BY updated_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create Knowledge Base
router.post('/', auth.verifyToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { name, description } = req.body;
  
  db.run(`INSERT INTO knowledge_bases (name, description) VALUES (?, ?)`, [name, description || ''], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, name, description, status: 'ACTIVE' });
  });
});

// Upload Document to KB
router.post('/:kb_id/documents', auth.verifyToken, upload.single('file'), async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  
  const kb_id = req.params.kb_id;
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  const originalName = file.originalname;
  const filePath = file.path;

  // Insert doc as Processing
  db.run(`INSERT INTO documents (kb_id, filename, filesize, status) VALUES (?, ?, ?, ?)`,
    [kb_id, originalName, file.size, '处理中'], async function(err) {
      if (err) return res.status(500).json({ error: err.message });
      const doc_id = this.lastID;
      res.json({ id: doc_id, filename: originalName, status: '处理中' });

      // Async process
      try {
        let text = '';
        if (originalName.endsWith('.pdf')) {
          const dataBuffer = fs.readFileSync(filePath);
          const data = await pdfParse(dataBuffer);
          text = data.text;
        } else if (originalName.endsWith('.docx') || originalName.endsWith('.doc')) {
          const result = await mammoth.extractRawText({ path: filePath });
          text = result.value;
        } else if (originalName.endsWith('.txt')) {
          text = fs.readFileSync(filePath, 'utf8');
        }

        // Split text into chunks (naive chunking by paragraphs or 500 chars)
        const chunks = text.match(/[\s\S]{1,500}/g) || [];

        for (const chunk of chunks) {
          if (chunk.trim().length < 10) continue;
          
          try {
            const embedding = await zhipu.getEmbedding(chunk.trim());
            db.run(`INSERT INTO document_chunks (doc_id, kb_id, content, embedding) VALUES (?, ?, ?, ?)`,
              [doc_id, kb_id, chunk.trim(), JSON.stringify(embedding)]);
          } catch(e) {
            console.error('Error embedding chunk', e);
          }
        }

        db.run(`UPDATE documents SET status = '已就绪' WHERE id = ?`, [doc_id]);
        db.run(`UPDATE knowledge_bases SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [kb_id]);
      } catch (procErr) {
        console.error(procErr);
        db.run(`UPDATE documents SET status = '解析失败' WHERE id = ?`, [doc_id]);
      }
  });
});

// Get Documents for KB
router.get('/:kb_id/documents', auth.verifyToken, (req, res) => {
  db.all(`SELECT * FROM documents WHERE kb_id = ? ORDER BY uploaded_at DESC`, [req.params.kb_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;
