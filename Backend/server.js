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

  ws.on('message', message => {
    console.log('Received execution request');
    let pythonProcess;

    try {
      const parsedMessage = JSON.parse(message);
      if (!parsedMessage.code) {
        ws.send(JSON.stringify({ type: 'stderr', data: 'No code provided.' }));
        return;
      }

      // Spawn a new Python process for each request, passing the code as an argument.
      // This cleanly separates the code from the stdin stream.
      pythonProcess = spawn('python', ['-u', '-c', parsedMessage.code]);

      // Listen for output from the Python script
      pythonProcess.stdout.on('data', data => {
        ws.send(JSON.stringify({ type: 'stdout', data: data.toString() }));
      });

      // Listen for errors
      pythonProcess.stderr.on('data', data => {
        ws.send(JSON.stringify({ type: 'stderr', data: data.toString() }));
      });

      // When the script finishes, close the WebSocket connection
      pythonProcess.on('exit', (code) => {
        console.log(`Python process exited with code ${code}`);
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });

      // If the user provided input, write it to the Python script's stdin
      if (parsedMessage.data) {
        pythonProcess.stdin.write(parsedMessage.data + '\n');
      }

      // Signal that no more input is coming
      pythonProcess.stdin.end();

    } catch (e) {
      console.error("Error processing message:", e);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'stderr', data: 'An internal server error occurred.' }));
      }
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});