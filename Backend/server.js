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

  // Handle messages from the client
  ws.on('message', message => {
    const parsedMessage = JSON.parse(message);

    // The first message from the client should be of type 'execute'
    if (parsedMessage.type === 'execute' && !pythonProcess) {
      console.log('Received execution request');
      
      // Spawn a new Python process
      // The '-u' flag ensures that stdout and stderr are unbuffered
      pythonProcess = spawn('python', ['-u', '-c', parsedMessage.code]);

      // Listen for output from the Python script
      pythonProcess.stdout.on('data', data => {
        // Send standard output to the frontend
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'stdout', data: data.toString() }));
        }
      });

      // Listen for errors from the Python script
      pythonProcess.stderr.on('data', data => {
        // Send standard error to the frontend
         if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'stderr', data: data.toString() }));
        }
      });

      // Listen for the Python process to exit
      pythonProcess.on('exit', (code) => {
        console.log(`Python process exited with code ${code}`);
        // Notify the frontend that the process has finished
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'exit', code: code }));
        }
        pythonProcess = null; // Clear the process variable
      });

    // Subsequent messages are treated as input for the running script
    } else if (parsedMessage.type === 'input' && pythonProcess) {
        try {
            // Write the user's input to the Python process's standard input
            pythonProcess.stdin.write(parsedMessage.data + '\n');
        } catch (error) {
            console.error("Error writing to stdin:", error);
        }
    }
  });

  // Handle the client disconnecting
  ws.on('close', () => {
    console.log('Client disconnected');
    // If the Python process is still running, terminate it
    if (pythonProcess) {
      pythonProcess.kill();
      pythonProcess = null;
    }
  });

  // Handle WebSocket errors
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
