const connectToDatabase = require('./utils/db');
const Lead = require('./models/Lead');
const nodemailer = require('nodemailer');

// Calculate score based on Lead data
function calculateScore(data) {
    let score = 0;
    if (data.budget === '50000+') score += 20;
    else if (data.budget === '20000-50000') score += 10;
    
    if (data.timeline === 'Immediate') score += 15;
    else if (data.timeline === '1-3 Months') score += 5;
    
    if (data.experience === 'Experienced') score += 10;
    else if (data.experience === 'Some') score += 5;
    
    if (data.time === 'Full-Time') score += 10;
    
    if (data.venture_type === 'Franchise') score += 5;
    else if (data.venture_type === 'Scalable Startup') score += 15;
    
    return score;
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
                html: `<div style="font-family: serif; color: #0f172a;">
                    <h2>Welcome to KY, ${data.name}.</h2>
                    <p>We have successfully received your business profile and capital details.</p>
                    <p>Our algorithm is currently pairing your profile with a dedicated business analyst. We will reach out within 48 hours to schedule your 1-on-1 strategy call.</p>
                    <p>You can track your application status securely here: <a href="https://kyintermediaters.vercel.app/portal.html?id=${newLead.clientId}">Client Portal</a></p>
                    <br><p>Best Regards,<br>KY Intermediater's Desk</p></div>`
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
