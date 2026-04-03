// ================= FULL STACK TRADING JOURNAL (ADVANCED VERSION) =================

// ================= BACKEND (Node.js + Express + MongoDB + JWT) =================

// Install:
// npm init -y
// npm install express mongoose cors body-parser jsonwebtoken bcryptjs

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const SECRET = "secretkey";

mongoose.connect('mongodb://127.0.0.1:27017/trading_journal');

// ================= USER MODEL =================
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

const User = mongoose.model('User', userSchema);

// ================= TRADE MODEL =================
const tradeSchema = new mongoose.Schema({
  userId: String,
  symbol: String,
  type: String,
  entryPrice: Number,
  exitPrice: Number,
  stopLoss: Number,
  takeProfit: Number,
  lotSize: Number,
  profit: Number,
  date: { type: Date, default: Date.now }
});

const Trade = mongoose.model('Trade', tradeSchema);

// ================= AUTH MIDDLEWARE =================
function auth(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// ================= AUTH ROUTES =================
app.post('/api/register', async (req, res) => {
  const hashed = await bcrypt.hash(req.body.password, 10);
  const user = new User({ email: req.body.email, password: hashed });
  await user.save();
  res.json({ message: 'User registered' });
});

app.post('/api/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.sendStatus(404);

  const valid = await bcrypt.compare(req.body.password, user.password);
  if (!valid) return res.sendStatus(401);

  const token = jwt.sign({ id: user._id }, SECRET);
  res.json({ token });
});

// ================= TRADE ROUTES =================
app.post('/api/trades', auth, async (req, res) => {
  const data = req.body;

  const profit = data.type === "BUY"
    ? (data.exitPrice - data.entryPrice) * data.lotSize
    : (data.entryPrice - data.exitPrice) * data.lotSize;

  const trade = new Trade({ ...data, profit, userId: req.user.id });
  await trade.save();
  res.json({ message: 'Trade added' });
});

app.get('/api/trades', auth, async (req, res) => {
  const trades = await Trade.find({ userId: req.user.id });
  res.json(trades);
});

// ================= ANALYTICS =================
app.get('/api/stats', auth, async (req, res) => {
  const trades = await Trade.find({ userId: req.user.id });

  const total = trades.length;
  const wins = trades.filter(t => t.profit > 0).length;
  const loss = trades.filter(t => t.profit <= 0).length;

  const winRate = total ? (wins / total) * 100 : 0;
  const totalProfit = trades.reduce((acc, t) => acc + t.profit, 0);

  res.json({ total, wins, loss, winRate, totalProfit });
});

app.listen(5000, () => console.log("Server running"));


// ================= FRONTEND (React + Dashboard) =================

// Install:
// npm install axios chart.js react-chartjs-2

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';

function App() {
  const [token, setToken] = useState("");
  const [stats, setStats] = useState({});
  const [trades, setTrades] = useState([]);

  const API = "http://localhost:5000";

  const login = async () => {
    const res = await axios.post(API + '/api/login', {
      email: "test@test.com",
      password: "123456"
    });
    setToken(res.data.token);
  };

  const fetchTrades = async () => {
    const res = await axios.get(API + '/api/trades', {
      headers: { Authorization: token }
    });
    setTrades(res.data);
  };

  const fetchStats = async () => {
    const res = await axios.get(API + '/api/stats', {
      headers: { Authorization: token }
    });
    setStats(res.data);
  };

  useEffect(() => {
    if (token) {
      fetchTrades();
      fetchStats();
    }
  }, [token]);

  const chartData = {
    labels: trades.map((t, i) => i + 1),
    datasets: [{
      label: 'Profit Curve',
      data: trades.map(t => t.profit)
    }]
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Trading Dashboard</h1>

      {!token && <button onClick={login}>Login</button>}

      {token && (
        <>
          <h2>Stats</h2>
          <p>Win Rate: {stats.winRate}%</p>
          <p>Total Profit: {stats.totalProfit}</p>

          <Line data={chartData} />

          <h2>Trades</h2>
          {trades.map((t, i) => (
            <div key={i}>
              {t.symbol} | {t.type} | {t.profit}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default App;


// ================= NEXT LEVEL FEATURES =================

// 1. MetaTrader Auto Sync (EA → API)
// 2. Risk Management Calculator
// 3. Daily Journal Notes
// 4. AI Trade Review
// 5. Mobile App (React Native)


// ================= DEPLOY =================

// Frontend: Vercel
// Backend: Render / Railway
// DB: MongoDB Atlas


// ================= DONE =================
// You now have a PROFESSIONAL trading journal SaaS base 🚀
