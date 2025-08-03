const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3001;

wss.on('connection', ws => {
  console.log('Client connected');

  // Use '-u' for unbuffered output from the python script
  const pythonProcess = spawn('python', ['-u']);

  pythonProcess.stdout.on('data', data => {
    ws.send(JSON.stringify({ type: 'stdout', data: data.toString() }));
  });

  pythonProcess.stderr.on('data', data => {
    ws.send(JSON.stringify({ type: 'stderr', data: data.toString() }));
  });

  // When the Python process finishes, close the connection
  pythonProcess.on('exit', (code) => {
    console.log(`Python process exited with code ${code}`);
    ws.close();
  });

  ws.on('message', message => {
    try {
      const parsedMessage = JSON.parse(message);
      if (parsedMessage.code) {
        pythonProcess.stdin.write(parsedMessage.code + '\n');
      }
      if (parsedMessage.data) {
        // Add a newline to the user input to satisfy Python's input()
        pythonProcess.stdin.write(parsedMessage.data + '\n');
      }
      // Signal that no more input is coming
      pythonProcess.stdin.end();

    } catch (e) {
      console.error("Invalid message format:", e);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    pythonProcess.kill();
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});