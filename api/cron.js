const connectToDatabase = require('../lib/utils/db');
const Lead = require('../lib/models/Lead');
const nodemailer = require('nodemailer');

const TEMPLATE = `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
    <div style="background-color: #0f172a; padding: 30px; text-align: center; border-bottom: 4px solid #d4af37;">
        <img src="https://kyintermediaters.vercel.app/images/favicon.png" alt="KY Intermediater's Logo" style="height: 60px; margin-bottom: 15px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 2px; text-transform: uppercase;">KY Intermediater's</h1>
    </div>
    <div style="padding: 40px 30px; background-color: #ffffff; color: #334155; line-height: 1.6;">
        <!--CONTENT-->
    </div>
    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 13px; color: #94a3b8;">&copy; ${new Date().getFullYear()} KY Intermediater's Desk. All rights reserved.</p>
        <p style="margin: 5px 0 0; font-size: 12px; color: #cbd5e1;">Bangalore, India</p>
    </div>
</div>
`;

function getHtml(content) {
    return TEMPLATE.replace('<!--CONTENT-->', content);
}

module.exports = async function handler(req, res) {
    // Vercel secures cron jobs with a secret header
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && !process.env.IS_LOCAL) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        await connectToDatabase();
        
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.status(500).json({ status: 'error', message: 'Email credentials not configured.' });
        }
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        // 1. Drip Campaign (3 days inactive)
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        // Find leads created roughly 3 days ago that are still marked as "New Lead" or "Contacted" with no meeting booked
        const inactiveLeads = await Lead.find({
            status: { $in: ['New Lead', 'Contacted'] },
            timestamp: { $lte: twoDaysAgo, $gte: new Date(threeDaysAgo.getTime() - 86400000) } // between 3 and 4 days ago
        });

        for (const lead of inactiveLeads) {
            // Check if they already have an activity log indicating a reminder was sent
            const hasReminder = lead.activityLog.some(log => log.action.includes('Automated Reminder'));
            if (hasReminder) continue;

            const html = getHtml(`
                <h2 style="color: #0f172a; font-size: 20px; margin-top: 0;">Next Steps with KY Intermediater's</h2>
                <p>Hi ${lead.name},</p>
                <p>We noticed you haven't scheduled your 1-on-1 strategy call yet. Our team of business analysts is waiting to review potential market opportunities with you.</p>
                <div style="text-align: center; margin: 35px 0;">
                    <a href="https://kyintermediaters.vercel.app/portal.html?id=${lead.clientId}" style="background-color: #d4af37; color: #0f172a; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Access Portal & Book Call</a>
                </div>
            `);

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: lead.email,
                subject: 'Action Required: Schedule Your Strategy Call',
                html: html
            });

            lead.activityLog.push({ time: new Date().toISOString(), action: 'Sent Automated Reminder Email' });
            await lead.save();
        }

        // 2. Admin Daily Digest
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const newLeads = await Lead.find({ timestamp: { $gte: yesterday } });
        const pendingReviews = await Lead.find({ status: 'New Lead' });

        const adminHtml = getHtml(`
            <h2 style="color: #0f172a; font-size: 20px; margin-top: 0;">Daily Portfolio Update</h2>
            <p>Here is your summary for the last 24 hours:</p>
            <ul style="background-color: #f1f5f9; padding: 20px; border-radius: 4px; font-size: 15px; list-style: none;">
                <li style="margin-bottom: 10px;"><strong>New Leads (24h):</strong> ${newLeads.length}</li>
                <li><strong>Total Pending Review:</strong> ${pendingReviews.length}</li>
            </ul>
            <div style="text-align: center; margin: 35px 0;">
                <a href="https://kyintermediaters.vercel.app/admin.html" style="background-color: #d4af37; color: #0f172a; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Open Dashboard</a>
            </div>
        `);

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: `KY Daily Digest: ${newLeads.length} New Leads`,
            html: adminHtml
        });

        return res.status(200).json({ status: 'success', message: `Processed ${inactiveLeads.length} drip emails and sent daily digest.` });
    } catch (error) {
        console.error('Cron Error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
}
