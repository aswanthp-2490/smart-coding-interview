const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 8085;

app.use(cors());
app.use(express.json());

app.get('/api/leaderboard', (req, res) => {
  console.log('Received request for leaderboard');
  try {
    const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'users.json'), 'utf8'));
    console.log('Serving', users.length, 'users');
    const leaderboard = users.map(u => ({ 
      username: u.username, 
      score: u.score, 
      isLoggedIn: true 
    }));
    res.json(leaderboard);
  } catch (e) {
    console.error('Error serving leaderboard:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('Minimal server listening on 8080');
});
