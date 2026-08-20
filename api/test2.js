module.exports = function (req, res) {
    try {
        let msg = '';
        try { require('mongoose'); msg += 'mongoose OK; '; } catch(e) { msg += 'mongoose FAIL: ' + e.message + '; '; }
        try { require('nodemailer'); msg += 'nodemailer OK; '; } catch(e) { msg += 'nodemailer FAIL: ' + e.message + '; '; }
        try { require('uuid'); msg += 'uuid OK; '; } catch(e) { msg += 'uuid FAIL: ' + e.message + '; '; }
        try { require('ics'); msg += 'ics OK; '; } catch(e) { msg += 'ics FAIL: ' + e.message + '; '; }
        
        res.status(200).json({ status: 'success', message: msg });
    } catch (e) {
        res.end('Crash: ' + e.message);
    }
};
