const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    title: { type: String, required: true }, // e.g. "SaaS Company in Bangalore"
    capital: String, // e.g. "Seeking $50k"
    description: String,
    industry: String,
    status: { type: String, default: 'Active' }, // Active, Closed
    isAnonymous: { type: Boolean, default: true }
});

module.exports = mongoose.models.Deal || mongoose.model('Deal', dealSchema);
