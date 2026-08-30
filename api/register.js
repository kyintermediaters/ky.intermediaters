const connectToDatabase = require('./utils/db');
const Lead = require('./models/Lead');
const nodemailer = require('nodemailer');
// Twilio config
const twilioClient = (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) ? require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN) : null;

// Calculate score based on Lead data
function calculateScore(data) {
    let score = 0;
    
    // Capital (Max 40)
    const cap = parseInt((data.capital || '0').replace(/[^0-9]/g, '')) || 0;
    if (cap >= 100000) score += 40;
    else if (cap >= 50000) score += 30;
    else if (cap >= 20000) score += 15;
    else score += 5;
    
    // Experience (Max 20)
    if (data.experience && data.experience.includes('Experienced')) score += 20;
    else if (data.experience && data.experience.includes('Some')) score += 10;
    else score += 5;
    
    // Timeline (Max 20)
    if (data.timeline && data.timeline.includes('Immediate')) score += 20;
    else if (data.timeline && data.timeline.includes('1-3 Months')) score += 15;
    else if (data.timeline && data.timeline.includes('3-6 Months')) score += 10;
    else score += 5;
    
    // Time Commitment (Max 20)
    if (data.timeComm && data.timeComm.includes('Full-Time')) score += 20;
    else if (data.timeComm && data.timeComm.includes('Part-Time')) score += 10;
    else score += 5;
    
    return Math.min(score, 100);
}

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

    if (req.method !== 'POST') {
        return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
    }

    try {
        await connectToDatabase();
        
        let body;
        try {
            // Handle plain text JSON (workaround from original api.js)
            body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        } catch (e) {
            body = req.body;
        }

        if (body.action !== 'register') {
            return res.status(400).json({ status: 'error', message: 'Invalid action' });
        }

        const data = body.data;
        const score = calculateScore(data);
        const initialLog = [{ time: new Date().toISOString(), action: "Registered" }];

        const newLead = new Lead({
            name: data.name,
            email: data.email,
            phone: data.phone,
            interest: data.interest,
            capital: data.budget,
            location: data.location,
            occupation: data.occupation,
            experience: data.experience,
            motivation: data.motivation,
            goal: data.goal,
            timeline: data.timeline,
            timeComm: data.time,
            ventureType: data.venture_type,
            risk: data.risk,
            score: score,
            activityLog: initialLog
        });

        await newLead.save();

        // Send Email
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
            });

            // Email to User
            const mailOptionsUser = {
                from: process.env.EMAIL_USER,
                to: data.email,
                subject: "Application Received | KY Intermediater's",
                html: `<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
    <div style="background-color: #0f172a; padding: 30px; text-align: center; border-bottom: 4px solid #d4af37;">
        <img src="https://kyintermediaters.vercel.app/images/favicon.png" alt="KY Intermediater's Logo" style="height: 60px; margin-bottom: 15px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 2px; text-transform: uppercase;">KY Intermediater's</h1>
    </div>
    <div style="padding: 40px 30px; background-color: #ffffff; color: #334155; line-height: 1.6;">
        <h2 style="color: #0f172a; font-size: 20px; margin-top: 0;">Welcome to KY, ${data.name}.</h2>
        <p>We have successfully received your business profile and capital details.</p>
        <p>Our algorithm is currently pairing your profile with a dedicated business analyst. We will reach out within <strong>48 hours</strong> to schedule your 1-on-1 strategy call.</p>
        
        <div style="text-align: center; margin: 35px 0;">
            <a href="https://kyintermediaters.vercel.app/portal.html?id=${newLead.clientId}" style="background-color: #d4af37; color: #0f172a; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Track Application Status</a>
        </div>
        
        <p style="font-size: 14px; color: #64748b; text-align: center;">You can securely track your real-time status, scheduled meetings, and documents via the portal above.</p>
    </div>
    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 13px; color: #94a3b8;">&copy; ${new Date().getFullYear()} KY Intermediater's Desk. All rights reserved.</p>
        <p style="margin: 5px 0 0; font-size: 12px; color: #cbd5e1;">Bangalore, India</p>
    </div>
</div>`
            };

            // Email to Admin
            const mailOptionsAdmin = {
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_USER, // Assuming admin is the sender
                subject: "New Lead Registration - KY Intelligence",
                text: `New lead registered:
Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone}
Capital: ${data.budget}
Interest: ${data.interest}

Login to portal to view details.`
            };

            try {
                await transporter.sendMail(mailOptionsUser);
                await transporter.sendMail(mailOptionsAdmin);
            } catch (mailError) {
                console.error("Email sending failed:", mailError);
            }
        } else {
            console.warn("EMAIL_USER or EMAIL_PASS not set in environment variables. Emails skipped.");
        }

        res.status(200).json({ status: 'success' });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
}
