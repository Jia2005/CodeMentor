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

  // Use '-u' for unbuffered output
  const pythonProcess = spawn('python', ['-u']);

  // Stream stdout from Python to the WebSocket client
  pythonProcess.stdout.on('data', data => {
    ws.send(JSON.stringify({ type: 'stdout', data: data.toString() }));
  });

  // Stream stderr from Python to the WebSocket client
  pythonProcess.stderr.on('data', data => {
    ws.send(JSON.stringify({ type: 'stderr', data: data.toString() }));
  });

  // When the Python process finishes, close the WebSocket connection.
  pythonProcess.on('exit', (code) => {
    console.log(`Python process exited with code ${code}`);
    ws.close();
  });

  // Handle messages from the client (code to execute)
  ws.on('message', message => {
    try {
      const parsedMessage = JSON.parse(message);
      if (parsedMessage.code) {
        pythonProcess.stdin.write(parsedMessage.code + '\n');
      }
      if (parsedMessage.data) {
        pythonProcess.stdin.write(parsedMessage.data);
      }
      // *** THIS IS THE FIX ***
      // Signal that no more data will be written to stdin.
      // This "un-sticks" the Python input() function.
      pythonProcess.stdin.end();

    } catch (e) {
      console.error("Invalid message format:", e);
    }
  });

  // Handle client disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
    // Ensure the Python process is terminated if the client disconnects.
    pythonProcess.kill();
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});