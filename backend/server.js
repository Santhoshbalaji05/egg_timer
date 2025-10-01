const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// In-memory storage for egg boiling history
let eggHistory = [];
let historyId = 1;

// Get cooking time endpoint
app.get('/api/eggs/cooking-time', (req, res) => {
  const { eggType, size, temperature } = req.query;
  
  const baseTimes = {
    soft: { small: 240, medium: 270, large: 300, 'extra-large': 330 },
    medium: { small: 330, medium: 360, large: 390, 'extra-large': 420 },
    hard: { small: 420, medium: 450, large: 480, 'extra-large': 510 }
  };

  let cookingTime = baseTimes[eggType][size];
  if (temperature === 'fridge') cookingTime += 30;
  
  res.json({ cookingTime });
});

// Save egg boiling history
app.post('/api/eggs/history', (req, res) => {
  const { eggType, size, temperature, cookingTime, notes, rating } = req.body;
  
  const historyEntry = {
    id: historyId++,
    eggType,
    size,
    temperature,
    cookingTime,
    notes: notes || '',
    rating: rating || 3,
    timestamp: new Date().toISOString(),
    status: 'completed'
  };

  eggHistory.unshift(historyEntry); // Add to beginning (newest first)
  
  console.log('✅ Saved egg boiling history:', historyEntry);
  res.status(201).json(historyEntry);
});

// Get all egg boiling history
app.get('/api/eggs/history', (req, res) => {
  res.json(eggHistory);
});

// Delete a history entry
app.delete('/api/eggs/history/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const initialLength = eggHistory.length;
  eggHistory = eggHistory.filter(entry => entry.id !== id);
  
  if (eggHistory.length < initialLength) {
    res.json({ message: 'History entry deleted' });
  } else {
    res.status(404).json({ error: 'History entry not found' });
  }
});

app.listen(5000, () => {
  console.log('🚀 Backend running on port 5000');
  console.log('📊 History endpoints:');
  console.log('   GET  /api/eggs/history');
  console.log('   POST /api/eggs/history');
});