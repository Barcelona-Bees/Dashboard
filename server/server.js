

const express = require('express');
const path = require('path');

const app = express();

// 🔥 Serve React build
app.use(express.static(path.join(__dirname, '../dist')));

// 🔥 API route (keep this)
app.get('/api/readings', (req, res) => {
  res.json([
    { hiveId: 1, reading: 72, timestamp: new Date() }
  ]);
});

// 🔥 FALLBACK (THIS IS THE FIX)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


