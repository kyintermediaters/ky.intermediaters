const connectToDatabase = require('./utils/db');
const Lead = require('./models/Lead');
const nodemailer = require('nodemailer');
const ics = require('ics');

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        await connectToDatabase();
        
        let body = {};
        if (req.method === 'POST') {
            try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } 
            catch (e) { body = req.body; }
        } else {
            body = req.query; // GET fallback
        }

        const pass = body.pass;
        if (pass !== (process.env.ADMIN_PASS || 'adminkypass')) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        const { email, name, date, time } = body;
        if (!email || !date || !time) return res.status(400).json({ status: 'error', message: 'Missing fields' });

        const [year, month, day] = date.split('-').map(Number);
        const [hour, minute] = time.split(':').map(Number);
        
        const event = {
            start: [year, month, day, hour, minute],
            duration: { hours: 1 },
            title: 'KY Strategy Call with ' + name,
            description: '1-on-1 Business Strategy and Due Diligence Call.',
            location: 'Google Meet / Zoom',
            status: 'CONFIRMED',
            busyStatus: 'BUSY',
            organizer: { name: 'KY Admin', email: process.env.EMAIL_USER || 'admin@ky.com' },
            attendees: [
                { name: name, email: email, rsvp: true, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT' }
            ]
        };

        ics.createEvent(event, async (error, value) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ status: 'error', message: 'Failed to generate ICS' });
            }
            
            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
                });
                
                // Send invite to client
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: 'Invitation: ' + event.title,
                    text: `Hi ${name},

Your strategy call is scheduled for ${date} at ${time}. Please find the calendar invite attached.

Best,
KY Team`,
                    icalEvent: {
                        filename: 'invite.ics',
                        method: 'request',
                        content: value
                    }
                });
                
                // Send invite to Admin
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: process.env.EMAIL_USER,
                    subject: 'Scheduled: ' + event.title,
                    text: `You have scheduled a strategy call with ${name} (${email}) for ${date} at ${time}.`,
                    icalEvent: {
                        filename: 'invite.ics',
                        method: 'request',
                        content: value
                    }
                });
            }

            // Update Lead Activity Log
            const lead = await Lead.findOne({ email });
            if (lead) {
                lead.activityLog.push({ time: new Date().toISOString(), action: `Scheduled Meeting on ${date} at ${time}` });
                await lead.save();
            }

            return res.status(200).json({ status: 'success' });
        });

    } catch (error) {
        console.error('Calendar Error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
}
