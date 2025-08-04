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
  let pythonProcess = null;

  ws.on('message', message => {
    try {
      const parsedMessage = JSON.parse(message);

      if (parsedMessage.type === 'execute' && parsedMessage.code) {
        if (pythonProcess) {
          pythonProcess.kill();
        }
        
        console.log('Received execution request');
        // The '-u' flag is for unbuffered binary stdout and stderr
        pythonProcess = spawn('python', ['-u', '-c', parsedMessage.code]);

        pythonProcess.stdout.on('data', data => {
          ws.send(JSON.stringify({ type: 'stdout', data: data.toString() }));
        });

        pythonProcess.stderr.on('data', data => {
          ws.send(JSON.stringify({ type: 'stderr', data: data.toString() }));
        });

        pythonProcess.on('exit', (code) => {
          console.log(`Python process exited with code ${code}`);
          if (ws.readyState === WebSocket.OPEN) {
             ws.send(JSON.stringify({ type: 'exit', code }));
          }
          pythonProcess = null;
        });
      
      } else if (parsedMessage.type === 'input' && pythonProcess) {
        pythonProcess.stdin.write(parsedMessage.data);
      }
    } catch (e) {
      console.error("Error processing message:", e);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'stderr', data: 'An internal server error occurred.' }));
      }
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    if (pythonProcess) {
      pythonProcess.kill();
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});