const axios = require('axios');

const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4';

const zhipuApi = axios.create({
  baseURL: ZHIPU_API_URL,
  headers: {
    'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

async function getEmbedding(text) {
  try {
    const response = await zhipuApi.post('/embeddings', {
      model: 'embedding-3',
      input: text
    });
    return response.data.data[0].embedding;
  } catch (err) {
    console.error('Embedding error:', err?.response?.data || err.message);
    throw new Error('Failed to get embeddings from Zhipu');
  }
}

async function chatCompletion(messages, stream = false) {
  try {
    const response = await zhipuApi.post('/chat/completions', {
      model: 'glm-4.7-flash',
      messages: messages,
      stream: stream
    }, {
      responseType: stream ? 'stream' : 'json'
    });
    return response;
  } catch (err) {
    console.error('Chat error:', err?.response?.data || err.message);
    throw new Error('Failed to call Zhipu chat model');
  }
}

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

module.exports = { getEmbedding, chatCompletion, cosineSimilarity };
