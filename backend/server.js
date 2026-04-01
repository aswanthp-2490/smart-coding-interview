require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const crypto = require('crypto');
const mongoose = require('mongoose');

// Models
const User = require('./models/User');
const Question = require('./models/Question');
const Submission = require('./models/Submission');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart-coding';
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s if DB is unreachable
}).then(async () => {
  console.log('Connected to MongoDB');
  // Seed Questions if empty
  const count = await Question.countDocuments();
  if (count === 0) {
    const questionsPath = path.join(__dirname, 'data', 'questions.json');
    if (fs.existsSync(questionsPath)) {
      const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
      await Question.insertMany(questionsData);
      console.log(`Seeded ${questionsData.length} questions into MongoDB`);
    }
  }
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

const onlineUsers = new Map();

// --- API Endpoints ---

// 1. Auth: Signup
app.post('/api/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = await User.create({ username, password, score: 0 });
    res.json({ message: 'Signup successful', user: { id: newUser._id, username: newUser.username, score: newUser.score } });
  } catch (err) {
    res.status(500).json({ message: 'Error signing up', error: err.message });
  }
});

// 2. Auth: Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({ message: 'Login successful', user: { id: user._id, username: user.username, score: user.score } });
  } catch (err) {
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
});

// 3. User Online Status
app.post('/api/heartbeat', (req, res) => {
  const { username } = req.body;
  if (username) onlineUsers.set(username, Date.now());
  res.json({ success: true });
});

app.post('/api/logout', (req, res) => {
  const { username } = req.body;
  if (username) onlineUsers.delete(username);
  res.json({ success: true });
});

// 4. Questions: Get all
app.get('/api/questions', async (req, res) => {
  try {
    const questions = await Question.find({});
    // Exclude Mongoose specific fields if necessary or just send
    res.json(questions.map(q => ({
      ...q.toObject(),
      _id: q._id.toString()
    })));
  } catch (err) {
    res.status(500).json({ message: 'Error fetching questions', error: err.message });
  }
});

// 5. Submit code and "Run" it
app.post('/api/submit', async (req, res) => {
  let tempDir = null;
  try {
    const { userId, questionId, code, language, timeTaken } = req.body;
    const question = await Question.findOne({ id: questionId });

    if (!question || !question.testCases || question.testCases.length === 0) {
       return res.json({ message: 'Submitted', passed: true, output: 'No test cases available. Passed manually.', scoreGained: 10 });
    }

    const id = crypto.randomUUID();
    tempDir = path.join(__dirname, 'temp', id);
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    let fileName, compileCmd, runCmd;
    if (language === 'cpp') {
      fileName = 'main.cpp';
      compileCmd = `g++ ${fileName} -o main.exe`;
      runCmd = `main.exe`;
    } else if (language === 'java') {
      fileName = 'Main.java';
      compileCmd = `javac ${fileName}`;
      runCmd = `java Main`;
    } else {
      fileName = 'main.js';
      compileCmd = '';
      runCmd = `node ${fileName}`;
    }

    const filePath = path.join(tempDir, fileName);
    fs.writeFileSync(filePath, code);

    let passedCount = 0;
    let outputLogs = [];

    if (compileCmd) {
      await new Promise((resolve, reject) => {
        exec(compileCmd, { cwd: tempDir }, (err, stdout, stderr) => {
          if (err) {
            // Check if the error is "command not found"
            if (err.message.includes('not recognized') || err.message.includes('not found')) {
              reject(`Compiler error: ${language === 'cpp' ? 'g++' : 'javac'} is not installed on the server.`);
            } else {
              reject(stderr || err.message);
            }
          } else {
            resolve(stdout);
          }
        });
      });
    }

    for (let i = 0; i < question.testCases.length; i++) {
        const { input, expectedOutput } = question.testCases[i];
        const inputPath = path.join(tempDir, `input${i}.txt`);
        fs.writeFileSync(inputPath, input);
        
        const result = await new Promise((resolve) => {
           exec(`${runCmd} < input${i}.txt`, { cwd: tempDir, timeout: 3000 }, (err, stdout, stderr) => {
             if (err) resolve({ success: false, output: (err.message || stderr).trim() });
             else resolve({ success: true, output: stdout.trim() });
           });
        });

        if (result.success && result.output === expectedOutput.trim()) {
          passedCount++;
          outputLogs.push(`Test Case ${i+1}: PASSED`);
        } else {
          outputLogs.push(`Test Case ${i+1}: FAILED\nInput:\n${input}\nExpected:\n${expectedOutput}\nGot:\n${result.output}`);
        }
    }

    const passed = passedCount === question.testCases.length;
    const scoreGained = passed ? 10 : Math.floor((passedCount / question.testCases.length) * 10);
    const output = outputLogs.join('\n\n');

    let validUserId = null;
    // Try to find the user by their ID or username to ensure the score updates correctly
    const userToUpdate = await User.findById(userId).catch(() => null) || await User.findOne({ username: userId });
    if (userToUpdate) {
      validUserId = userToUpdate._id;
    }

    // Create Submission with fallback if MongoDB times out or fails
    try {
      await Submission.create({ 
        userId: validUserId, 
        questionId, 
        code, 
        language, 
        passed, 
        scoreGained, 
        timeTaken,
        output
      });

      // Update User Score
      if (scoreGained > 0 && validUserId) {
        await User.findByIdAndUpdate(validUserId, { $inc: { score: scoreGained } });
      }
    } catch (dbErr) {
      console.error('Database persistence error:', dbErr.message);
      // We still want to return the result to the user even if the DB write fails
      outputLogs.push(`WARNING: Result not saved to leaderboard due to database connection issue.`);
    }

    // Return the new total score so the UI updates immediately
    let newTotalScore = 0;
    if (validUserId) {
      try {
        const updatedUser = await User.findById(validUserId);
        newTotalScore = updatedUser ? updatedUser.score : 0;
      } catch (e) {}
    }
    res.json({ 
      message: 'Submitted', 
      passed, 
      output, 
      scoreGained, 
      newTotalScore: updatedUser ? updatedUser.score : 0 
    });

  } catch (err) {
    res.status(500).json({ message: 'Submission execution error', output: err.message || err.toString() });
  } finally {
    // Cleanup
    if (tempDir && fs.existsSync(tempDir)) {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
    }
  }
});

// 6. Leaderboard (for Angular/React apps)
app.get('/api/leaderboard', async (req, res) => {
  try {
    const users = await User.find({}).sort({ score: -1 });
    const leaderboard = users.map(u => ({ 
      username: u.username, 
      score: u.score,
      isLoggedIn: onlineUsers.has(u.username) && (Date.now() - onlineUsers.get(u.username) < 15000)
    }));
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching leaderboard', error: err.message });
  }
});

// Serve Static Frontends (Production fallback)
app.use(express.static(path.join(__dirname, 'public')));

app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
