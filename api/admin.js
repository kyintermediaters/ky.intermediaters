const connectToDatabase = require('../lib/utils/db');
const Lead = require('../lib/models/Lead');
const Deal = require('../lib/models/Deal');
const AdminUser = require('../lib/models/AdminUser');
const { v4: uuidv4 } = require('uuid');
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


        // Auth logic: Support legacy ADMIN_PASS or new RBAC token
        let isAdmin = false;
        let adminRole = 'superadmin'; // legacy default
        
        if (body.action === 'adminLogin') {
            const user = await AdminUser.findOne({ username: body.username, password: body.password });
            if (user) {
                user.token = uuidv4();
                await user.save();
                return res.status(200).json({ status: 'success', token: user.token, role: user.role });
            }
            return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }
        
        if (body.action === 'createAdmin') {
            // Must use master pass to create first admin
            if (body.pass !== (process.env.ADMIN_PASS || 'adminkypass')) {
                return res.status(401).json({ status: 'error', message: 'Unauthorized to create admins' });
            }
            await AdminUser.create({ username: body.username, password: body.password, role: body.role });
            return res.status(200).json({ status: 'success' });
        }

        const pass = body.pass || body.token;
        if (pass === (process.env.ADMIN_PASS || 'adminkypass')) {
            isAdmin = true;
        } else {
            const user = await AdminUser.findOne({ token: pass });
            if (user) {
                isAdmin = true;
                adminRole = user.role;
            }
        }

        if (!isAdmin) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }
        
        // Protect certain routes from analysts
        if (adminRole === 'analyst' && (body.action === 'bulkBroadcast' || body.action === 'deleteDeal')) {
            return res.status(403).json({ status: 'error', message: 'Analysts cannot perform this action.' });
        }


        
        if (body.action === 'getDeals') {
            const deals = await Deal.find({}).sort({ timestamp: -1 });
            return res.status(200).json({ status: 'success', data: deals });
        }
        
        if (body.action === 'createDeal') {
            await Deal.create({ title: body.title, capital: body.capital, description: body.description, industry: body.industry });
            return res.status(200).json({ status: 'success' });
        }
        
        if (body.action === 'deleteDeal') {
            await Deal.findByIdAndDelete(body.id);
            return res.status(200).json({ status: 'success' });
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
                text: emailBody, html: `<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
    <div style="background-color: #0f172a; padding: 30px; text-align: center; border-bottom: 4px solid #d4af37;">
        <img src="https://kyintermediaters.vercel.app/images/favicon.png" alt="KY Intermediater's Logo" style="height: 60px; margin-bottom: 15px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 2px; text-transform: uppercase;">KY Intermediater's</h1>
    </div>
    <div style="padding: 40px 30px; background-color: #ffffff; color: #334155; line-height: 1.6;">
        
        <h2 style="color: #0f172a; font-size: 20px; margin-top: 0;">${subject}</h2>
        <div style="white-space: pre-wrap; margin-top: 20px;">${emailBody}</div>

    </div>
    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 13px; color: #94a3b8;">&copy; ${new Date().getFullYear()} KY Intermediater's Desk. All rights reserved.</p>
        <p style="margin: 5px 0 0; font-size: 12px; color: #cbd5e1;">Bangalore, India</p>
    </div>
</div>`
            });
            
            return res.status(200).json({ status: 'success' });
        }

        return res.status(400).json({ status: 'error', message: 'Invalid action' });
    } catch (error) {
        console.error('Admin API Error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
}
