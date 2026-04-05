fetch('https://smart-coding-interview-backend.onrender.com/api/submit', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({userId: 'u-1', questionId: 'q1_easy', code: 'console.log(\'0 1\');', language: 'js', timeTaken: 10})
})
.then(r => r.json())
.then(data => console.log('RESPONSE:', data))
.catch(err => console.error('ERROR:', err));
