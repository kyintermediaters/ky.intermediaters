const mongoose = require('mongoose');

let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) return cachedDb;
    
    if (!process.env.MONGODB_URI) {
        throw new Error('Please define the MONGODB_URI environment variable');
    }

    const opts = { bufferCommands: false };
    const db = await mongoose.connect(process.env.MONGODB_URI, opts);
    cachedDb = db;
    return db;
}

module.exports = connectToDatabase;