const connectToDatabase = require('../lib/utils/db');
const Lead = require('../lib/models/Lead');
const nodemailer = require('nodemailer');
const ics = require('ics');

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
                    text: `Calendar Invite`, html: `<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
    <div style="background-color: #0f172a; padding: 30px; text-align: center; border-bottom: 4px solid #d4af37;">
        <img src="https://kyintermediaters.vercel.app/images/favicon.png" alt="KY Intermediater's Logo" style="height: 60px; margin-bottom: 15px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 2px; text-transform: uppercase;">KY Intermediater's</h1>
    </div>
    <div style="padding: 40px 30px; background-color: #ffffff; color: #334155; line-height: 1.6;">
        
        <h2 style="color: #0f172a; font-size: 20px; margin-top: 0;">Strategy Call Confirmed</h2>
        <p>Your 1-on-1 strategy call has been successfully scheduled.</p>
        <ul style="background-color: #f1f5f9; padding: 20px; border-radius: 4px; font-size: 15px; list-style: none;">
            <li style="margin-bottom: 10px;"><strong>Date:</strong> ${date}</li>
            <li style="margin-bottom: 10px;"><strong>Time:</strong> ${time}</li>
            <li><strong>Participant:</strong> ${name}</li>
        </ul>
        <p>Please find the attached calendar invitation (.ics) to add this directly to your schedule.</p>

    </div>
    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 13px; color: #94a3b8;">&copy; ${new Date().getFullYear()} KY Intermediater's Desk. All rights reserved.</p>
        <p style="margin: 5px 0 0; font-size: 12px; color: #cbd5e1;">Bangalore, India</p>
    </div>
</div>`,
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
                    text: `Calendar Invite`, html: `<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
    <div style="background-color: #0f172a; padding: 30px; text-align: center; border-bottom: 4px solid #d4af37;">
        <img src="https://kyintermediaters.vercel.app/images/favicon.png" alt="KY Intermediater's Logo" style="height: 60px; margin-bottom: 15px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 2px; text-transform: uppercase;">KY Intermediater's</h1>
    </div>
    <div style="padding: 40px 30px; background-color: #ffffff; color: #334155; line-height: 1.6;">
        
        <h2 style="color: #0f172a; font-size: 20px; margin-top: 0;">Meeting Scheduled</h2>
        <p>You have scheduled a strategy call with a client.</p>
        <ul style="background-color: #f1f5f9; padding: 20px; border-radius: 4px; font-size: 15px; list-style: none;">
            <li style="margin-bottom: 10px;"><strong>Date:</strong> ${date}</li>
            <li style="margin-bottom: 10px;"><strong>Time:</strong> ${time}</li>
            <li><strong>Client:</strong> ${name} (${email})</li>
        </ul>

    </div>
    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 13px; color: #94a3b8;">&copy; ${new Date().getFullYear()} KY Intermediater's Desk. All rights reserved.</p>
        <p style="margin: 5px 0 0; font-size: 12px; color: #cbd5e1;">Bangalore, India</p>
    </div>
</div>`,
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
