const http = require('http');
const server = http.createServer((req, res) => {
  console.log('Request received');
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello from simple server\n');
});
server.listen(8080, '0.0.0.0', () => {
  console.log('Simple server listening on port 8080');
});
// Also try to read from backend/data/users.json just to be sure
try {
  const fs = require('fs');
  const path = require('path');
  const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'users.json'), 'utf8'));
  console.log('Read', users.length, 'users');
} catch (e) {
  console.error('Failed to read users:', e.message);
}
