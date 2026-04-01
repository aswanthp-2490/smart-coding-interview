require('child_process').exec('node server.js', (err, out, stderr) => {
    require('fs').writeFileSync('test_output.txt', out + '\nERROR:\n' + (stderr || err));
});
