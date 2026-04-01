const http = require('http');

console.log('Sending login request...');
const req = http.request({
  hostname: 'localhost',
  port: 8080,
  path: '/api/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', body));
});

req.on('error', e => console.log('ERROR:', e.message));
req.write(JSON.stringify({ username: "Aswanth", password: "123" }));
req.end();
