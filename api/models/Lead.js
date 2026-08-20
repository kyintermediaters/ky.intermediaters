const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const leadSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    clientId: { type: String, default: uuidv4 },
    name: String,
    email: { type: String, required: true, unique: true },
    phone: String,
    interest: String,
    capital: String,
    location: String,
    occupation: String,
    experience: String,
    motivation: String,
    goal: String,
    timeline: String,
    timeComm: String,
    ventureType: String,
    risk: String,
    
    // CRM Fields
    status: { type: String, default: 'New Lead' },
    notes: { type: String, default: '' },
    score: { type: Number, default: 0 },
    reminderDate: { type: String, default: '' },
    agent: { type: String, default: 'Unassigned' },
    
    // Portal Fields
    documents: { type: Array, default: [] },
    activityLog: { type: Array, default: [] }
});

module.exports = mongoose.models.Lead || mongoose.model('Lead', leadSchema);