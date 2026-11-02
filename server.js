require('dotenv').config();
const express = require('express');
const path = require('path');
const connectToDatabase = require('./lib/utils/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Body Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS Middleware
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    if (req.method === 'OPTIONS') return res.status(200).end();
    next();
});

// API Routes (re-uses existing Vercel serverless handlers)
app.all('/api/register', require('./api/register'));
app.all('/api/portal', require('./api/portal'));
app.all('/api/admin', require('./api/admin'));
app.all('/api/auth', require('./api/auth'));
app.all('/api/calendar', require('./api/calendar'));
app.all('/api/cron', require('./api/cron'));

// Healthcheck
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), server: 'KY Express Backend' });
});

// Serve Static Frontend Files
app.use(express.static(__dirname));

// Fallback for HTML routing
app.get('/portal', (req, res) => res.sendFile(path.join(__dirname, 'portal.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'register.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Start Server
app.listen(PORT, async () => {
    console.log(`\n==================================================`);
    console.log(`🚀 KY Intermediater's Backend Server Active`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`📂 Endpoints Mounted:`);
    console.log(`   - POST /api/register`);
    console.log(`   - ALL  /api/portal`);
    console.log(`   - ALL  /api/admin`);
    console.log(`   - ALL  /api/auth`);
    console.log(`   - ALL  /api/calendar`);
    console.log(`   - GET  /api/cron`);
    console.log(`   - GET  /api/health`);
    console.log(`==================================================\n`);

    if (process.env.MONGODB_URI) {
        try {
            await connectToDatabase();
            console.log(`✅ MongoDB Atlas Connected Successfully.`);
        } catch (err) {
            console.error(`⚠️ MongoDB Connection Error:`, err.message);
        }
    } else {
        console.warn(`⚠️ Warning: MONGODB_URI not found in environment. Set it in .env or your host.`);
    }
});
