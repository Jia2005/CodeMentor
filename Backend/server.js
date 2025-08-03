require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process'); // To execute python scripts
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// This route handles the code execution requests from the frontend
app.post('/api/execute', (req, res) => {
  // Expect 'code' and optional 'userInput' from the request body
  const { code, userInput } = req.body;

  if (!code) {
    return res.status(400).json({ error: "No code provided to execute." });
  }

  // A temporary file is created to safely execute the received code
  const tempFilePath = path.join(__dirname, `temp_script_${Date.now()}.py`);
  fs.writeFileSync(tempFilePath, code);

  const pythonProcess = spawn('python', [tempFilePath]);

  let output = '';
  let errorOutput = '';

  // Listen for data from the python script's standard output (stdout)
  pythonProcess.stdout.on('data', (data) => {
    output += data.toString();
  });

  // Listen for any errors from the python script's standard error (stderr)
  pythonProcess.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });

  // This event fires when the python script finishes execution
  pythonProcess.on('close', (exitCode) => {
    fs.unlinkSync(tempFilePath); // Important: clean up the temporary file
    res.json({ output: output, error: errorOutput || null });
  });

  // If the user provided input, write it to the Python script's standard input (stdin)
  if (userInput) {
    pythonProcess.stdin.write(userInput + '\n');
  }
  // Close the stdin stream to signal that no more input will be sent
  pythonProcess.stdin.end();

  // Handle potential errors with the spawn process itself (e.g., python not found)
  pythonProcess.on('error', (err) => {
      console.error('Failed to start subprocess.', err);
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath); // Ensure cleanup on spawn error
      }
      res.status(500).json({ error: 'Failed to execute the script on the server.' });
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});