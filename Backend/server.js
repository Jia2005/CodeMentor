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
    const parsedMessage = JSON.parse(message);
    if (parsedMessage.type === 'execute' && !pythonProcess) {
      console.log('Received execution request');
      pythonProcess = spawn('python', ['-u', '-c', parsedMessage.code]);

      pythonProcess.stdout.on('data', data => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'stdout', data: data.toString() }));
        }
      });

      pythonProcess.stderr.on('data', data => {
        const errorOutput = data.toString();
        // Check for traceback to identify a code error
        if (errorOutput.includes('Traceback')) {
          // Send a specific 'error' message with details
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'error', data: errorOutput, line: null }));
            // Note: Line number parsing is complex. For a basic implementation, we send null and let the AI figure it out.
          }
        } else {
          // Other stderr messages (warnings, etc.)
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'stderr', data: errorOutput }));
          }
        }
      });

      pythonProcess.on('exit', (code) => {
        console.log(`Python process exited with code ${code}`);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'exit', code: code }));
        }
        pythonProcess = null;
      });

    } else if (parsedMessage.type === 'input' && pythonProcess) {
      try {
        pythonProcess.stdin.write(parsedMessage.data + '\n');
      } catch (error) {
        console.error("Error writing to stdin:", error);
      }
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    if (pythonProcess) {
      pythonProcess.kill();
      pythonProcess = null;
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    if (pythonProcess) {
      pythonProcess.kill();
      pythonProcess = null;
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});