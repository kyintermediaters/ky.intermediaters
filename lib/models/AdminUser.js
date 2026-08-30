const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Simple plain text for now, ideally hashed
    role: { type: String, default: 'analyst' }, // 'superadmin' or 'analyst'
    token: { type: String } // Simple session token
});

module.exports = mongoose.models.AdminUser || mongoose.model('AdminUser', adminSchema);
