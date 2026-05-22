const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

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

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 View environment variables at http://localhost:${PORT}/env`);
});
