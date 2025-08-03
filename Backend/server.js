require('dotenv').config();
const http = require('http');
const express = require('express');
const WebSocket = require('ws');
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3001;

wss.on('connection', ws => {
  // Spawn a persistent, interactive Python shell for the session.
  // The '-u' flag is crucial for unbuffered, real-time output.
  const pythonProcess = spawn('python', ['-u']);

  // Forward output from the Python shell to the frontend client.
  pythonProcess.stdout.on('data', data => {
    ws.send(JSON.stringify({ type: 'stdout', data: data.toString() }));
  });

  // Forward errors from the Python shell to the frontend client.
  pythonProcess.stderr.on('data', data => {
    ws.send(JSON.stringify({ type: 'stderr', data: data.toString() }));
  });

  // Handle messages received from the frontend client.
  ws.on('message', message => {
    try {
      const parsedMessage = JSON.parse(message);

      // When the client sends code to run or user input, write it
      // to the Python shell's standard input.
      if (parsedMessage.type === 'run' && parsedMessage.code) {
        pythonProcess.stdin.write(parsedMessage.code + '\n');
      } else if (parsedMessage.type === 'stdin' && parsedMessage.data) {
        pythonProcess.stdin.write(parsedMessage.data);
      }
    } catch (e) {
      console.error("Invalid message format:", e);
    }
  });

  // Clean up the Python process when the client disconnects.
  ws.on('close', () => {
    pythonProcess.kill();
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});