const connectToDatabase = require('./utils/db');
const OTP = require('./models/OTP');
const nodemailer = require('nodemailer');

export default async function handler(req, res) {
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
                    text: `Your verification code is: ${otp}
This code expires in 10 minutes.`
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
