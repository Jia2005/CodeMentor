const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const { GoogleGenerativeAI } = require("@google/generative-ai"); // 1. Import Gemini
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3001;

// 2. Initialize Gemini using the backend's environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

wss.on('connection', ws => {
  console.log('Client connected');
  let pythonProcess = null;

  ws.on('message', async message => { // Make this async to handle AI await calls
    const parsedMessage = JSON.parse(message);

    // --- HANDLE CODE EXECUTION ---
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
        const tracebackRegex = /File "<string>", line (\d+)/;
        const match = errorOutput.match(tracebackRegex);
        if (ws.readyState === WebSocket.OPEN) {
          if (match) {
            ws.send(JSON.stringify({ type: 'error', data: errorOutput, line: parseInt(match[1], 10) }));
          } else {
            ws.send(JSON.stringify({ type: 'stderr', data: errorOutput }));
          }
        }
      });

      pythonProcess.on('exit', (code) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'exit', code }));
        }
        pythonProcess = null;
      });
    } 
    
    // --- HANDLE TERMINAL INPUT ---
    else if (parsedMessage.type === 'input' && pythonProcess) {
      try {
        pythonProcess.stdin.write(parsedMessage.data + '\n');
      } catch (error) {
        console.error("Error writing to stdin:", error);
      }
    }

    // --- NEW: HANDLE AI EXPLANATION REQUESTS ---
    else if (parsedMessage.type === 'get_explanation') {
      try {
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          generationConfig: { responseMimeType: "application/json" }
        });

        let prompt = `Analyze the following Python code. Provide a step-by-step explanation for each line...`; // [Your full prompt here]
        
        const result = await model.generateContent(prompt);
        ws.send(JSON.stringify({ type: 'explanation_result', data: JSON.parse(result.response.text()) }));
      } catch (err) {
        console.error(err);
        ws.send(JSON.stringify({ type: 'explanation_result', data: [] }));
      }
    }
  });

  ws.on('close', () => {
    if (pythonProcess) pythonProcess.kill();
  });
});

server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));