const express = require('express');
const { createClient } = require('redis');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'super-secret-key-change-in-production';


const users = [];


const redisClient = createClient({
    url: 'rediss://default:X',
    socket: {
        tls: true,
        rejectUnauthorized: false
    }
});
redisClient.on('error', (err) => console.log('Redis Client Error', err));


const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};




app.post('/auth/register', (req, res) => {
    const { username, password } = req.body;
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ error: 'User already exists' });
    }
    const user = { id: String(users.length + 1), username, password };
    users.push(user);
    res.status(201).json({ message: 'User registered successfully', userId: user.id });
});


app.post('/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    res.json({ token });
});


app.post('/scores', authenticateToken, async (req, res) => {
    const { score, gameId } = req.body;
    const userId = req.user.username;

    await redisClient.zAdd('leaderboard:global', { score: Number(score), value: userId });

    await redisClient.zAdd(`leaderboard:${gameId}`, { score: Number(score), value: userId });

    const today = new Date().toISOString().split('T')[0];
    await redisClient.zAdd(`leaderboard:daily:${today}`, { score: Number(score), value: userId });

    res.json({ message: 'Score submitted successfully', score, user: userId });
});

app.get('/leaderboard', async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;

    const topPlayers = await redisClient.zRangeWithScores('leaderboard:global', 0, limit - 1, {
        REV: true
    });

    res.json({ leaderboard: topPlayers });
});

app.get('/leaderboard/rank', authenticateToken, async (req, res) => {
    const userId = req.user.username;

    const rank = await redisClient.zRevRank('leaderboard:global', userId);
    const score = await redisClient.zScore('leaderboard:global', userId);

    if (rank === null) return res.status(404).json({ message: 'User unranked' });

    res.json({
        user: userId,
        rank: rank + 1,
        score
    });
});

app.get('/reports/:period', async (req, res) => {
    const { period } = req.params; // e.g., 'daily:2023-10-24' or 'game1'
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;

    const report = await redisClient.zRangeWithScores(`leaderboard:${period}`, 0, limit - 1, {
        REV: true
    });

    res.json({ period, report });
});

const startServer = async () => {
    await redisClient.connect();
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log('Redis connected successfully.');
    });
};

startServer();
