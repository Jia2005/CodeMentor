require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3001;

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
  let pythonProcess = null;

  ws.on('message', message => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'run' && data.code) {
        // The Python '-u' flag is crucial for unbuffered, real-time output
        pythonProcess = spawn('python', ['-u', '-c', data.code]);

        pythonProcess.stdout.on('data', output => {
          ws.send(JSON.stringify({ type: 'stdout', data: output.toString() }));
        });

        pythonProcess.stderr.on('data', error => {
          ws.send(JSON.stringify({ type: 'stderr', data: error.toString() }));
        });

        pythonProcess.on('close', () => {
          ws.send(JSON.stringify({ type: 'exit' }));
          ws.close();
        });

        pythonProcess.on('error', (err) => {
            ws.send(JSON.stringify({ type: 'error', data: 'Failed to start Python process.' }));
            ws.close();
        });

      } else if (data.type === 'stdin' && pythonProcess) {
        pythonProcess.stdin.write(data.data);
      }
    } catch (e) {
      console.error("Failed to process message or invalid message format:", e);
    }
  });

  ws.on('close', () => {
    if (pythonProcess) {
      pythonProcess.kill();
    }
  });
});

app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});