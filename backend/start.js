const { spawn } = require('child_process');
const path = require('path');

const backendDir = path.join(__dirname);

const proc = spawn('python3', [
  '-c',
  `import os; os.chdir('${backendDir}'); import uvicorn; uvicorn.run('main:app', host='0.0.0.0', port=8000, loop='asyncio')`
], {
  cwd: backendDir,
  stdio: 'inherit',
  env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' }
});

proc.on('error', (err) => {
  console.error('Failed to start backend:', err);
  process.exit(1);
});

proc.on('exit', (code) => {
  process.exit(code || 0);
});
