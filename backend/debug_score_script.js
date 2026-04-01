const mongoose = require('mongoose');
const User = require('./models/User');

async function debug() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/smart-coding');
    const user = await User.findOne({ username: 'Aswanth' });
    require('fs').writeFileSync('debug_score.txt', JSON.stringify(user, null, 2));
  } catch (err) {
    require('fs').writeFileSync('debug_score.txt', 'ERROR: ' + err.message);
  } finally {
    process.exit(0);
  }
}
debug();
