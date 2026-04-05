const { spawn } = require('child_process');
const fs = require('fs');

const out = fs.openSync('d:/fst_project/smart-coding-interview/backend/out.log', 'a');

const child = spawn('node', ['server.js'], {
  detached: true,
  cwd: 'd:/fst_project/smart-coding-interview/backend',
  stdio: ['ignore', out, out]
});

child.unref();
console.log('Spawned backend server with PID:', child.pid);
