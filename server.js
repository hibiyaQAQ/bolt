const express = require('express');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
});

// Landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ENV API endpoint - returns JSON
app.get('/api/env', (req, res) => {
  const envVars = { ...process.env };
  
  // Sort keys alphabetically
  const sorted = {};
  Object.keys(envVars).sort().forEach(key => {
    sorted[key] = envVars[key];
  });

  res.json({
    total: Object.keys(sorted).length,
    timestamp: new Date().toISOString(),
    variables: sorted
  });
});

// ENV page - serves the viewer UI
app.get('/env', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'env.html'));
});

// Chat page
app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// AI Chat API - streaming proxy to Anthropic
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages is required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: 'You are a helpful assistant embedded in an environment variable viewer tool. You help users understand their sandbox environment, debug configuration issues, and answer questions about environment variables, API keys, paths, and system configuration. Be concise and helpful.',
      messages,
    });

    stream.on('text', (text) => {
      res.write(`data: ${JSON.stringify({ type: 'text', text })}\n\n`);
    });

    stream.on('end', () => {
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
    });

    stream.on('error', (err) => {
      console.error('Stream error:', err);
      res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
      res.end();
    });
  } catch (err) {
    console.error('Chat error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
      res.end();
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`View environment variables at http://localhost:${PORT}/env`);
  console.log(`AI Chat at http://localhost:${PORT}/chat`);
});
