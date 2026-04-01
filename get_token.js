const { exec } = require('child_process');
const fs = require('fs');
exec('gh auth token', (error, stdout, stderr) => {
    if (error) {
        fs.writeFileSync('gh_token_err.txt', error.toString() + '\\n' + stderr);
        return;
    }
    fs.writeFileSync('gh_token.txt', stdout.trim());
});
