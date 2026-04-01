const mongoose = require('mongoose');
const User = require('./models/User');

async function check() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/smart-coding');
    const count = await User.countDocuments();
    const all = await User.find({});
    require('fs').writeFileSync('count_result.txt', `COUNT: ${count}\nDATA: ${JSON.stringify(all, null, 2)}`);
  } catch (err) {
    require('fs').writeFileSync('count_result.txt', `ERROR: ${err.message}`);
  } finally {
    process.exit(0);
  }
}
check();
