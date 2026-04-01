async function testSubmit() {
  try {
    const res = await fetch('http://localhost:8080/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'test_user_1',
        questionId: 'q1_easy',
        code: `const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim().split('\\n');
if(!input[0]) process.exit(0);
const n = parseInt(input[0]);
const arr = input[1].split(' ').map(Number);
const target = parseInt(input[2]);
for(let i=0; i<n; i++) {
  for(let j=i+1; j<n; j++) {
    if(arr[i]+arr[j] === target) {
      console.log(i + ' ' + j);
      process.exit(0);
    }
  }
}`,
        language: 'js',
        timeTaken: 10
      })
    });
    const data = await res.json();
    console.log('SUCCESS:', data);
  } catch(err) {
    console.error('ERROR:', err);
  }
}

testSubmit();
