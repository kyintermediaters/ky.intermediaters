const connectToDatabase = require('../lib/utils/db');
const OTP = require('../lib/models/OTP');
const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        await connectToDatabase();
        let body = {};
        try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } catch (e) { body = req.body; }

        if (body.action === 'sendOTP') {
            const email = body.email;
            if (!email) return res.status(400).json({ status: 'error', message: 'Email required' });

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            
            await OTP.deleteMany({ email }); // clear old OTPs
            await OTP.create({ email, otp });

            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
                });
                
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: 'Your KY Security Code',
                    text: `Your verification code is: ${otp}`, html: `<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
    <div style="background-color: #0f172a; padding: 30px; text-align: center; border-bottom: 4px solid #d4af37;">
        <img src="https://kyintermediaters.vercel.app/images/favicon.png" alt="KY Intermediater's Logo" style="height: 60px; margin-bottom: 15px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 2px; text-transform: uppercase;">KY Intermediater's</h1>
    </div>
    <div style="padding: 40px 30px; background-color: #ffffff; color: #334155; line-height: 1.6;">
        
        <h2 style="color: #0f172a; font-size: 20px; margin-top: 0;">Secure Portal Authentication</h2>
        <p>You requested access to the KY Intermediater's secure portal.</p>
        <p>Please use the following One-Time Password to complete your verification:</p>
        <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #d4af37; background-color: #0f172a; padding: 15px 30px; border-radius: 4px;">${otp}</span>
        </div>
        <p style="font-size: 14px; color: #64748b; text-align: center;">This code will expire in 10 minutes. Do not share this code with anyone.</p>

    </div>
    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 13px; color: #94a3b8;">&copy; ${new Date().getFullYear()} KY Intermediater's Desk. All rights reserved.</p>
        <p style="margin: 5px 0 0; font-size: 12px; color: #cbd5e1;">Bangalore, India</p>
    </div>
</div>`
                });
            } else {
                console.warn("EMAIL_USER not set, OTP not sent via email. OTP is:", otp);
            }
            
            return res.status(200).json({ status: 'success' });
        }

        if (body.action === 'verifyOTP') {
            const { email, otp } = body;
            const record = await OTP.findOne({ email, otp });
            
            if (record) {
                await OTP.deleteOne({ _id: record._id }); // consume OTP
                return res.status(200).json({ status: 'success' });
            } else {
                return res.status(400).json({ status: 'error', message: 'Invalid or expired OTP' });
            }
        }

        return res.status(400).json({ status: 'error', message: 'Invalid action' });
    } catch (error) {
        console.error('Auth Error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
}
