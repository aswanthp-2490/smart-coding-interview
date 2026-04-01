const mongoose = require('mongoose');
const User = require('./models/User');

async function check() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/smart-coding');
    const all = await User.find({ username: /Aswanth/i });
    console.log('USERS_FOUND:');
    console.log(JSON.stringify(all, null, 2));
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    process.exit(0);
  }
}
check();
