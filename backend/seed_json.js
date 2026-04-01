require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('./models/User');
const Question = require('./models/Question');
const Submission = require('./models/Submission');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart-coding';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  try {
    const usersPath = path.join(__dirname, 'data', 'users.json');
    if (fs.existsSync(usersPath)) {
      const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
      for (const u of usersData) {
        const existing = await User.findOne({ username: u.username });
        if (!existing) {
          // Keep _id if it was a valid ObjectId, otherwise just create a new one
          await User.create({ username: u.username, password: u.password, score: u.score });
        }
      }
      console.log('Seeded users from JSON');
    }

    const subsPath = path.join(__dirname, 'data', 'submissions.json');
    if (fs.existsSync(subsPath)) {
      const subsData = JSON.parse(fs.readFileSync(subsPath, 'utf8'));
      for (const s of subsData) {
        // Find correct new user
        let userDoc = null;
        if (s.userId) {
          // We can't lookup by id directly unless we matched the old 'id' field,
          // but our User schema doesn't have an 'old_id'. Let's just create an anonymous submission or rely on finding it by username, but submission json only has userId.
          // In the current local JSON backend, users.json "id" is stored.
          // Let's lookup old user from usersData to find username, then find new user
          const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
          const oldUser = usersData.find(u => u.id === s.userId);
          if (oldUser) {
            userDoc = await User.findOne({ username: oldUser.username });
          }
        }
        
        const newUserId = userDoc ? userDoc._id.toString() : s.userId;

        await Submission.create({
           userId: newUserId,
           questionId: s.questionId,
           code: s.code,
           language: s.language,
           passed: s.passed,
           scoreGained: s.scoreGained,
           timeTaken: s.timeTaken,
           output: s.output || ''
        });
      }
      console.log('Seeded submissions from JSON');
    }

  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Done');
  }
}

seed();
