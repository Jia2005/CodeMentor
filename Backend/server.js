require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

app.post('/api/execute', (req, res) => {
  const { code } = req.body;
  console.log('Received code to execute:', code);

  // THIS IS WHERE THE DOCKER LOGIC WILL GO.
  // For now, we'll send back a mock response.
  res.json({
    output: `(Mock Output) Your code was received and will be executed soon.`,
    error: null
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});