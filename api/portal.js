const connectToDatabase = require('./utils/db');
const Lead = require('./models/Lead');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        await connectToDatabase();
        
        let body = {};
        if (req.method === 'POST') {
            try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } catch(e) { body = req.body; }
        } else {
            body = req.query;
        }
        
        const id = body.id;
        if (!id) return res.status(400).json({ status: 'error', message: 'Missing ID' });
        
        const lead = await Lead.findOne({ clientId: id });
        if (!lead) return res.status(404).json({ status: 'error', message: 'Invalid Link' });
        
        if (req.method === 'POST' && body.action === 'signNDA') {
            lead.ndaSigned = true;
            lead.ndaTimestamp = new Date().toISOString();
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown IP';
            lead.activityLog.push({ time: lead.ndaTimestamp, action: `Signed Digital NDA (IP: ${ip})` });
            await lead.save();
            return res.status(200).json({ status: 'success' });
        }
        
        return res.status(200).json({ 
            status: 'success', 
            data: { 
                name: lead.name,
                email: lead.email,
                status: lead.status, 
                logs: lead.activityLog, 
                agent: lead.agent, 
                docs: lead.documents,
                ndaSigned: lead.ndaSigned
            } 
        });
    } catch (error) {
        console.error('Portal Error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
}
