const mongoose = require('mongoose');

async function connectToDatabase() {
    if (!process.env.MONGODB_URI) {
        throw new Error('Please define the MONGODB_URI environment variable');
    }

    if (mongoose.connection.readyState === 1) {
        return mongoose.connection.asPromise();
    }

    const opts = { bufferCommands: false, serverSelectionTimeoutMS: 5000 };
    return await mongoose.connect(process.env.MONGODB_URI, opts);
}

module.exports = connectToDatabase;
