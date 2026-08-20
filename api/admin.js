const connectToDatabase = require('./utils/db');
const Lead = require('./models/Lead');
const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        await connectToDatabase();
        
        let body = {};
        if (req.method === 'POST') {
            try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } 
            catch (e) { body = req.body; }
        } else {
            body = req.query; // GET requests use query params
        }

        const pass = body.pass;
        if (pass !== (process.env.ADMIN_PASS || 'adminkypass')) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        if (body.action === 'getRegistrations') {
            const leads = await Lead.find({}).sort({ timestamp: -1 });
            
            // Format leads into arrays to match what admin.js expects from the old Google Sheets backend
            const formattedData = leads.map(lead => [
                lead.timestamp,
                lead.name,
                lead.email,
                lead.phone,
                lead.interest,
                lead.capital,
                lead.location,
                lead.occupation,
                lead.experience,
                lead.motivation,
                lead.goal,
                lead.timeline,
                lead.timeComm,
                lead.ventureType,
                lead.risk,
                lead.status,
                lead.notes,
                lead.score,
                lead.reminderDate,
                JSON.stringify(lead.documents),
                JSON.stringify(lead.activityLog),
                lead.agent,
                lead.clientId
            ]);
            
            return res.status(200).json({ status: 'success', data: formattedData });
        }

        if (body.action === 'updateLead') {
            const { email, field, value } = body;
            
            // Map frontend column names to mongoose schema fields
            const fieldMap = {
                'Status': 'status',
                'Notes': 'notes',
                'ReminderDate': 'reminderDate',
                'Documents': 'documents',
                'Agent': 'agent'
            };
            
            const schemaField = fieldMap[field];
            if (!schemaField) return res.status(400).json({ status: 'error', message: 'Invalid field' });
            
            const updateObj = {};
            if (field === 'Documents') {
                updateObj[schemaField] = JSON.parse(value);
            } else {
                updateObj[schemaField] = value;
            }
            
            const lead = await Lead.findOne({ email });
            if (!lead) return res.status(404).json({ status: 'error', message: 'Lead not found' });
            
            lead[schemaField] = updateObj[schemaField];
            lead.activityLog.push({ time: new Date().toISOString(), action: `Updated ${field} to ${value}` });
            await lead.save();
            
            return res.status(200).json({ status: 'success' });
        }
        
        if (body.action === 'bulkBroadcast') {
            if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
                return res.status(500).json({ status: 'error', message: 'Email credentials not configured.' });
            }
            
            const { emails, subject, body: emailBody } = body;
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
            });
            
            // Send BCC to hide emails
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                bcc: emails,
                subject: subject,
                text: emailBody
            });
            
            return res.status(200).json({ status: 'success' });
        }

        return res.status(400).json({ status: 'error', message: 'Invalid action' });
    } catch (error) {
        console.error('Admin API Error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
}
