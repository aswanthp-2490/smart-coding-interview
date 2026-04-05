require('dotenv').config();
const fs = require('fs');
const path = require('path');
const logFile = path.join(__dirname, 'startup.log');
const log = (msg) => fs.appendFileSync(logFile, new Date().toISOString() + ' - ' + msg + '\n');
log('--- Server starting ---');

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const crypto = require('crypto');
const mongoose = require('mongoose');

log('Dependencies loaded');

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
let isDbConnected = false;

const initDb = async () => {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
    console.log('Connected to MongoDB');
    isDbConnected = true;
  } catch (err) {
    if (err.message.includes('ECONNREFUSED') && MONGODB_URI.includes('127.0.0.1')) {
      console.log('Local MongoDB not found. Attempting to start in-memory database...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
        console.log('Connected to In-Memory MongoDB at', mongoUri);
        isDbConnected = true;
      } catch (memErr) {
        console.warn('Could not start mongodb-memory-server:', memErr.message);
        console.log('FALLBACK: Using local JSON files for read-only/simulated mode.');
      }
    } else {
      console.error('MongoDB Initial Connection Error:', err.message);
    }
  }

  // Seed Questions if using a real or in-memory DB
  if (isDbConnected) {
    try {
      const count = await Question.countDocuments();
      if (count === 0) {
        const questionsPath = path.join(__dirname, 'data', 'questions.json');
        if (fs.existsSync(questionsPath)) {
          const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
          await Question.insertMany(questionsData);
          console.log(`Seeded ${questionsData.length} questions into MongoDB`);
        }
      }
    } catch (e) {
      console.error('Error seeding data:', e);
    }
  }
};

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
  initDb();
});

// --- JSON Mock Database Helper (Only used if isDbConnected is false) ---
const mockData = {
  getQuestions: () => {
    try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'questions.json'), 'utf8')); }
    catch(e) { return []; }
  },
  getUsers: () => {
    try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'users.json'), 'utf8')); }
    catch(e) { return []; }
  },
  saveUser: (user) => {
    const users = mockData.getUsers();
    users.push(user);
    fs.writeFileSync(path.join(__dirname, 'data', 'users.json'), JSON.stringify(users, null, 2));
  },
  updateUserScore: (userId, scoreGained) => {
    const users = mockData.getUsers();
    const user = users.find(u => u._id === userId || u.username === userId);
    if (user) {
      user.score = (user.score || 0) + scoreGained;
      fs.writeFileSync(path.join(__dirname, 'data', 'users.json'), JSON.stringify(users, null, 2));
      return user;
    }
    return null;
  }
};

// Helper to check DB status
const checkDb = (res) => {
  const state = mongoose.connection.readyState;
  // 1 = connected, 2 = connecting
  if (state !== 1 && state !== 2 && !isDbConnected) {
    // Only log warning instead of failing, as we now have Mock fallbacks
    console.warn(`Database not ready (ReadyState: ${state}). Proceeding in Simulated Mode.`);
    return false; 
  }
  return false;
};

const onlineUsers = new Map();

// Helper to normalize strings for comparison (handles whitespace and line endings)
const normalizeOutput = (val) => {
  if (val === null || val === undefined) return '';
  return val.toString()
    .replace(/\r\n/g, '\n') // Standardize line endings
    .trim()
    .split(/\s+/) // Split by any whitespace
    .join(' '); // Rejoin with single space
};

// --- API Endpoints ---

// 1. Auth: Signup
app.post('/api/signup', async (req, res) => {
  if (checkDb(res)) return;
  try {
    const { username, password } = req.body;
    
    if (!isDbConnected) {
      const users = mockData.getUsers();
      if (users.find(u => u.username === username)) {
         return res.status(400).json({ message: 'User already exists' });
      }
      const newUser = { _id: Date.now().toString(), username, password, score: 0 };
      mockData.saveUser(newUser);
      return res.json({ message: 'Signup successful (Mock Mode)', user: { id: newUser._id, username: newUser.username, score: newUser.score } });
    }

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
  if (checkDb(res)) return;
  try {
    const { username, password } = req.body;
    
    if (!isDbConnected) {
       const users = mockData.getUsers();
       const user = users.find(u => u.username === username && u.password === password);
       if (!user) return res.status(401).json({ message: 'Invalid credentials (Mock Mode)' });
       return res.json({ message: 'Login successful (Mock Mode)', user: { id: user._id || user.username, username: user.username, score: user.score || 0 } });
    }

    const user = await User.findOne({ username, password });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({ message: 'Login successful', user: { id: user._id, username: user.username, score: user.score } });
  } catch (err) {
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
});

// 0. Health: Check DB and server status
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    status: 'ok',
    database: {
      state: states[dbState] || 'unknown',
      connected: isDbConnected,
      uri_configured: !!process.env.MONGODB_URI
    },
    timestamp: new Date().toISOString()
  });
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
  if (checkDb(res)) return;
  try {
    if (!isDbConnected) {
       return res.json(mockData.getQuestions());
    }
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
  if (checkDb(res)) return;
  let tempDir = null;
  try {
    const { userId, questionId, code, language, timeTaken } = req.body;
    let question;
    if (!isDbConnected) {
       question = mockData.getQuestions().find(q => q.id === questionId);
    } else {
       question = await Question.findOne({ id: questionId });
    }

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

    let compileError = null;
    if (compileCmd) {
      await new Promise((resolve) => {
        exec(compileCmd, { cwd: tempDir }, (err, stdout, stderr) => {
          if (err) {
            // Check if the error is "command not found"
            if (err.message.includes('not recognized') || err.message.includes('not found')) {
              compileError = `Compiler error: ${language === 'cpp' ? 'g++' : 'javac'} is not installed on the server. Please install it or use JavaScript.`;
            } else {
              compileError = stderr || err.message;
            }
          }
          resolve(stdout);
        });
      });
    }

    if (compileError) {
      // Return 200 with failure to show the compiler output to the user safely
      return res.json({ 
        message: 'Submitted', 
        passed: false, 
        output: `Compilation Error:\n${compileError}`, 
        scoreGained: 0, 
        newTotalScore: 0 // Just keeping structure, UI doesn't strictly need it if score > 0 logic
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

        const normalizedOutput = normalizeOutput(result.output);
        const normalizedExpected = normalizeOutput(expectedOutput);

        if (result.success && normalizedOutput === normalizedExpected) {
          passedCount++;
          outputLogs.push(`Test Case ${i+1}: PASSED`);
        } else {
          outputLogs.push(`Test Case ${i+1}: FAILED\nInput:\n${input}\nExpected (Normalized):\n"${normalizedExpected}"\nGot (Normalized):\n"${normalizedOutput}"\nRaw Output:\n${result.output}`);
        }
    }

    const passed = passedCount === question.testCases.length;
    const scoreGained = passed ? 10 : Math.floor((passedCount / question.testCases.length) * 10);
    const output = outputLogs.join('\n\n');

    let validUserId = null;
    let userToUpdate = null;
    if (!isDbConnected) {
       userToUpdate = mockData.getUsers().find(u => u._id === userId || u.username === userId);
    } else {
       // Try to find the user by their ID or username to ensure the score updates correctly
       userToUpdate = await User.findById(userId).catch(() => null) || await User.findOne({ username: userId });
    }

    if (userToUpdate) {
      validUserId = userToUpdate._id;
    }

    if (!isDbConnected) {
       if (scoreGained > 0 && userId) {
          mockData.updateUserScore(userId, scoreGained);
       }
       outputLogs.push(`WARNING: Result not saved to leaderboard due to database connection issue. (Mock Mode Active)`);
    } else {
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
    }

    // Return the new total score so the UI updates immediately
    let newTotalScore = 0;
    try {
      if (!isDbConnected && userId) {
         const user = mockData.getUsers().find(u => u._id === userId || u.username === userId);
         newTotalScore = user ? user.score : 0;
      } else if (validUserId) {
         const user = await User.findById(validUserId);
         newTotalScore = user ? user.score : 0;
      }
    } catch (e) {
      console.error('Error fetching updated score:', e.message);
    }

    // FINAL DEBUG LOGGING
    console.log(`Submission Result: ${passed ? 'PASSED' : 'FAILED'} | Score Gained: ${scoreGained} | Total Score: ${newTotalScore}`);

    res.json({ 
      message: 'Submitted', 
      passed, 
      output, 
      scoreGained, 
      newTotalScore
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
  if (checkDb(res)) return;
  try {
    if (!isDbConnected) {
       let users = mockData.getUsers();
       users.sort((a,b) => (b.score || 0) - (a.score || 0));
       const leaderboard = users.map(u => ({
         username: u.username,
         score: u.score || 0,
         isLoggedIn: onlineUsers.has(u.username) && (Date.now() - onlineUsers.get(u.username) < 15000)
       }));
       return res.json(leaderboard);
    }
    
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
