import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = 'http://localhost:5000/api';

function App() {
  const [eggType, setEggType] = useState('soft');
  const [size, setSize] = useState('large');
  const [temperature, setTemperature] = useState('room');
  const [cookingTime, setCookingTime] = useState(300);
  const [timeLeft, setTimeLeft] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState([]);
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(3);
  const [showHistory, setShowHistory] = useState(false);
  const [isBoiling, setIsBoiling] = useState(false);

  // Calculate cooking time when options change
  useEffect(() => {
    const updateCookingTime = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/eggs/cooking-time`, {
          params: { eggType, size, temperature }
        });
        setCookingTime(response.data.cookingTime);
        setTimeLeft(response.data.cookingTime);
      } catch (error) {
        // Fallback calculation
        const baseTimes = {
          soft: { small: 240, medium: 270, large: 300, 'extra-large': 330 },
          medium: { small: 330, medium: 360, large: 390, 'extra-large': 420 },
          hard: { small: 420, medium: 450, large: 480, 'extra-large': 510 }
        };
        let fallbackTime = baseTimes[eggType][size];
        if (temperature === 'fridge') fallbackTime += 30;
        setCookingTime(fallbackTime);
        setTimeLeft(fallbackTime);
      }
    };
    updateCookingTime();
  }, [eggType, size, temperature]);

  // Timer logic
  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      setIsBoiling(true);
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setIsBoiling(false);
      playCompleteSound();
      saveToHistory();
    } else {
      setIsBoiling(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // Fetch history when component mounts
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/eggs/history`);
      setHistory(response.data);
    } catch (error) {
      console.log('Could not fetch history');
    }
  };

  const saveToHistory = async () => {
    try {
      await axios.post(`${API_BASE_URL}/eggs/history`, {
        eggType,
        size,
        temperature,
        cookingTime,
        notes,
        rating
      });
      fetchHistory();
    } catch (error) {
      console.log('Could not save history');
    }
  };

  const deleteHistory = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/eggs/history/${id}`);
      fetchHistory();
    } catch (error) {
      console.log('Could not delete history entry');
    }
  };

  const startTimer = () => {
    if (timeLeft > 0 && !isRunning) {
      setIsRunning(true);
      playStartSound();
    }
  };

  const pauseTimer = () => {
    setIsRunning(false);
    setIsBoiling(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsBoiling(false);
    setTimeLeft(cookingTime);
  };

  // Egg boiling start sound
  const playStartSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Water boiling sound (bubbles)
      oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.5);
      
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.log('Audio not supported');
    }
  };

  // Egg timer complete sound
  const playCompleteSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Classic timer alarm sound
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.3);
      
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);

      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification('🥚 Egg Timer Complete!', {
          body: `Your ${getDonenessText(eggType).toLowerCase()} ${size} egg is ready!`,
          icon: '/favicon.ico'
        });
      } else if (Notification.permission === 'default') {
        Notification.requestPermission();
      }

      // Fallback alert
      setTimeout(() => {
        alert(`🥚 Egg Timer Complete!\nYour ${getDonenessText(eggType).toLowerCase()} ${size} egg is ready!`);
      }, 1000);

    } catch (e) {
      alert(`🥚 Egg Timer Complete!\nYour ${getDonenessText(eggType).toLowerCase()} ${size} egg is ready!`);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getDonenessText = (eggType) => {
    const types = {
      soft: 'Soft Boiled',
      medium: 'Medium Boiled', 
      hard: 'Hard Boiled'
    };
    return types[eggType] || eggType;
  };

  // Request notification permission on load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="App">
      <header className="app-header">
        <h1>🥚 Perfect Egg Timer</h1>
        <p>Get your eggs cooked exactly how you like them!</p>
      </header>

      <div className="container">
        <div className="timer-section">
          <div className="egg-form">
            <h2>Configure Your Egg</h2>
            
            <div className="form-group">
              <label>Doneness:</label>
              <select value={eggType} onChange={(e) => setEggType(e.target.value)}>
                <option value="soft">Soft Boiled</option>
                <option value="medium">Medium Boiled</option>
                <option value="hard">Hard Boiled</option>
              </select>
            </div>

            <div className="form-group">
              <label>Egg Size:</label>
              <select value={size} onChange={(e) => setSize(e.target.value)}>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="extra-large">Extra Large</option>
              </select>
            </div>

            <div className="form-group">
              <label>Starting Temperature:</label>
              <select value={temperature} onChange={(e) => setTemperature(e.target.value)}>
                <option value="fridge">From Fridge</option>
                <option value="room">Room Temperature</option>
              </select>
            </div>

            <div className="form-group">
              <label>Notes (optional):</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did it turn out?"
                className="notes-input"
              />
            </div>

            <div className="form-group">
              <label>Rate this cook (1-5 stars):</label>
              <select value={rating} onChange={(e) => setRating(parseInt(e.target.value))}>
                <option value="1">1 ⭐</option>
                <option value="2">2 ⭐⭐</option>
                <option value="3">3 ⭐⭐⭐</option>
                <option value="4">4 ⭐⭐⭐⭐</option>
                <option value="5">5 ⭐⭐⭐⭐⭐</option>
              </select>
            </div>
          </div>

          <div className="timer-display">
            {/* Egg-shaped Timer */}
            <div className={`egg-container ${isBoiling ? 'boiling' : ''}`}>
              <div className="egg">
                <div className="egg-white">
                  <div className="egg-yolk">
                    <div className="time-text">{formatTime(timeLeft)}</div>
                    <div className="time-label">
                      {isRunning ? 'Boiling...' : isBoiling ? 'Hot!' : 'Ready'}
                    </div>
                  </div>
                </div>
                {/* Bubbles for boiling effect */}
                {isBoiling && (
                  <>
                    <div className="bubble bubble-1"></div>
                    <div className="bubble bubble-2"></div>
                    <div className="bubble bubble-3"></div>
                    <div className="bubble bubble-4"></div>
                    <div className="steam steam-1"></div>
                    <div className="steam steam-2"></div>
                    <div className="steam steam-3"></div>
                  </>
                )}
              </div>
            </div>

            <div className="timer-controls">
              {!isRunning ? (
                <button className="btn start-btn" onClick={startTimer}>
                  🍳 Start Boiling
                </button>
              ) : (
                <button className="btn pause-btn" onClick={pauseTimer}>
                  ⏸️ Pause
                </button>
              )}
              <button className="btn reset-btn" onClick={resetTimer}>
                🔄 Reset
              </button>
            </div>

            <div className="recipe-info">
              <p><strong>Recommended time:</strong> {formatTime(cookingTime)}</p>
              <p><strong>Doneness:</strong> {getDonenessText(eggType)}</p>
              <p><strong>Size:</strong> {size}</p>
              <p><strong>Temperature:</strong> {temperature === 'fridge' ? 'From Fridge' : 'Room Temp'}</p>
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="history-section">
          <button 
            className="btn history-btn"
            onClick={() => {
              setShowHistory(!showHistory);
              fetchHistory();
            }}
          >
            {showHistory ? 'Hide Cooking History' : 'Show Cooking History'}
          </button>

          {showHistory && (
            <div className="history-list">
              <h3>🥚 Your Egg Boiling History</h3>
              
              {history.length === 0 ? (
                <div className="empty-history">
                  <p>No eggs boiled yet!</p>
                  <p>Start cooking to see your history here.</p>
                </div>
              ) : (
                <div className="history-items">
                  {history.map((item) => (
                    <div key={item.id} className="history-item">
                      <div className="history-content">
                        <div className="history-header">
                          <span className="egg-type">{getDonenessText(item.eggType)}</span>
                          <span className="egg-size">{item.size} egg</span>
                          <span className="rating">{'⭐'.repeat(item.rating)}</span>
                        </div>
                        <div className="history-details">
                          <span><strong>Time:</strong> {formatTime(item.cookingTime)}</span>
                          <span><strong>Temp:</strong> {item.temperature === 'fridge' ? 'Fridge' : 'Room'}</span>
                          <span><strong>Date:</strong> {formatDate(item.timestamp)}</span>
                        </div>
                        {item.notes && (
                          <div className="history-notes">
                            <strong>Notes:</strong> {item.notes}
                          </div>
                        )}
                      </div>
                      <button 
                        className="btn delete-btn"
                        onClick={() => deleteHistory(item.id)}
                        title="Delete this entry"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;