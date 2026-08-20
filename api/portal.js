const connectToDatabase = require('./utils/db');
const Lead = require('./models/Lead');

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        await connectToDatabase();
        
        let id = req.query.id;
        if (!id) return res.status(400).json({ status: 'error', message: 'Missing ID' });
        
        const lead = await Lead.findOne({ clientId: id });
        if (!lead) return res.status(404).json({ status: 'error', message: 'Invalid Link' });
        
        return res.status(200).json({ 
            status: 'success', 
            data: { 
                status: lead.status, 
                logs: lead.activityLog, 
                agent: lead.agent, 
                docs: lead.documents 
            } 
        });
    } catch (error) {
        console.error('Portal Error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
}
